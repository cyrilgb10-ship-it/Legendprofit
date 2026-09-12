import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const MIN_WITHDRAWAL_AMOUNT = 3100;
const WITHDRAWAL_FEE = 500;

type WithdrawalSource = "REFERRAL" | "TASK";

type WithdrawalMethod =
  | "TMONEY"
  | "FLOOZ"
  | "MTN_MOBILE_MONEY"
  | "WAVE";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Votre compte n'est pas encore activé." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const method = body.method as WithdrawalMethod;
    const account = String(body.account || "").trim();
    const source = body.source as WithdrawalSource;
    const taskId = body.taskId ? String(body.taskId) : null;

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant du retrait est invalide." },
        { status: 400 }
      );
    }

    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        {
          error: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL_AMOUNT.toLocaleString(
            "fr-FR"
          )} FCFA.`,
        },
        { status: 400 }
      );
    }

    const allowedMethods: WithdrawalMethod[] = [
      "TMONEY",
      "FLOOZ",
      "MTN_MOBILE_MONEY",
      "WAVE",
    ];

    if (!allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: "Méthode de retrait invalide." },
        { status: 400 }
      );
    }

    if (!account) {
      return NextResponse.json(
        { error: "Veuillez renseigner le numéro du compte de paiement." },
        { status: 400 }
      );
    }

    if (source !== "REFERRAL" && source !== "TASK") {
      return NextResponse.json(
        { error: "Source de retrait invalide." },
        { status: 400 }
      );
    }

    if (source === "REFERRAL" && taskId) {
      return NextResponse.json(
        {
          error:
            "Un retrait de parrainage ne peut pas être associé à une tâche.",
        },
        { status: 400 }
      );
    }

    if (source === "TASK" && !taskId) {
      return NextResponse.json(
        {
          error: "Veuillez sélectionner la tâche concernée par le retrait.",
        },
        { status: 400 }
      );
    }

    const netAmount = amount - WITHDRAWAL_FEE;

    const result = await prisma.$transaction(async (tx) => {
      if (source === "REFERRAL") {
        const currentUser = await tx.user.findUnique({
          where: {
            id: user.id,
          },
          select: {
            balance: true,
          },
        });

        if (!currentUser) {
          throw new Error("USER_NOT_FOUND");
        }

        if (currentUser.balance < amount) {
          throw new Error("INSUFFICIENT_REFERRAL_BALANCE");
        }

        const updatedUser = await tx.user.updateMany({
          where: {
            id: user.id,
            balance: {
              gte: amount,
            },
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        if (updatedUser.count !== 1) {
          throw new Error("INSUFFICIENT_REFERRAL_BALANCE");
        }
      }

      if (source === "TASK") {
        const task = await tx.task.findUnique({
          where: {
            id: taskId!,
          },
          select: {
            id: true,
            title: true,
          },
        });

        if (!task) {
          throw new Error("TASK_NOT_FOUND");
        }

        const taskBalance = await tx.taskBalance.findUnique({
          where: {
            userId_taskId: {
              userId: user.id,
              taskId: task.id,
            },
          },
          select: {
            balance: true,
          },
        });

        if (!taskBalance) {
          throw new Error("TASK_BALANCE_NOT_FOUND");
        }

        if (taskBalance.balance < amount) {
          throw new Error("INSUFFICIENT_TASK_BALANCE");
        }

        const updatedTaskBalance = await tx.taskBalance.updateMany({
          where: {
            userId: user.id,
            taskId: task.id,
            balance: {
              gte: amount,
            },
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        if (updatedTaskBalance.count !== 1) {
          throw new Error("INSUFFICIENT_TASK_BALANCE");
        }
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          fee: WITHDRAWAL_FEE,
          netAmount,
          method,
          account,
          source,
          taskId: source === "TASK" ? taskId : null,
          status: "PENDING",
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount: -amount,
          description:
            source === "TASK"
              ? `Retrait de la tâche ${taskId}`
              : "Retrait des gains de parrainage",
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL_FEE",
          amount: -WITHDRAWAL_FEE,
          description:
            source === "TASK"
              ? `Frais de retrait de la tâche ${taskId}`
              : "Frais de retrait des gains de parrainage",
        },
      });

      return withdrawal;
    });

    return NextResponse.json({
      success: true,
      message:
        source === "TASK"
          ? "Votre retrait de tâche a été enregistré et est en attente de traitement."
          : "Votre retrait de parrainage a été enregistré et est en attente de traitement.",
      withdrawal: {
        id: result.id,
        amount: result.amount,
        fee: result.fee,
        netAmount: result.netAmount,
        method: result.method,
        account: result.account,
        source: result.source,
        taskId: result.taskId,
        status: result.status,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INSUFFICIENT_REFERRAL_BALANCE":
          return NextResponse.json(
            {
              error:
                "Votre solde de parrainage est insuffisant pour effectuer ce retrait.",
            },
            { status: 400 }
          );

        case "INSUFFICIENT_TASK_BALANCE":
          return NextResponse.json(
            {
              error:
                "Le solde de cette tâche est insuffisant pour effectuer ce retrait.",
            },
            { status: 400 }
          );

        case "TASK_NOT_FOUND":
          return NextResponse.json(
            { error: "La tâche demandée n'existe pas." },
            { status: 404 }
          );

        case "TASK_BALANCE_NOT_FOUND":
          return NextResponse.json(
            { error: "Aucun solde n'est disponible pour cette tâche." },
            { status: 400 }
          );

        case "USER_NOT_FOUND":
          return NextResponse.json(
            { error: "Utilisateur introuvable." },
            { status: 404 }
          );
      }
    }

    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement du retrait." },
      { status: 500 }
    );
  }
}
