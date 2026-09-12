import { NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const WITHDRAWAL_FEE = 500;

export async function GET() {
  try {
    await requireAdmin();

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        fee: true,
        netAmount: true,
        method: true,
        account: true,
        source: true,
        taskId: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const taskIds = withdrawals
      .map((withdrawal) => withdrawal.taskId)
      .filter((taskId): taskId is string => Boolean(taskId));

    const tasks =
      taskIds.length > 0
        ? await prisma.task.findMany({
            where: {
              id: {
                in: taskIds,
              },
            },
            select: {
              id: true,
              title: true,
            },
          })
        : [];

    const taskMap = new Map(
      tasks.map((task) => [task.id, task.title])
    );

    return NextResponse.json({
      withdrawals: withdrawals.map((withdrawal) => ({
        ...withdrawal,
        taskTitle: withdrawal.taskId
          ? taskMap.get(withdrawal.taskId) ?? "Tâche inconnue"
          : null,
      })),
    });
  } catch (error) {
    console.error("Admin withdrawals GET error:", error);

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du chargement des retraits.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const withdrawalId = String(body.withdrawalId || "").trim();
    const action = String(body.action || "").toUpperCase();

    if (!withdrawalId) {
      return NextResponse.json(
        { error: "Identifiant du retrait manquant." },
        { status: 400 }
      );
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Action invalide." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: {
          id: withdrawalId,
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          fee: true,
          netAmount: true,
          source: true,
          taskId: true,
          status: true,
        },
      });

      if (!withdrawal) {
        throw new Error("WITHDRAWAL_NOT_FOUND");
      }

      if (withdrawal.status !== "PENDING") {
        throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
      }

      if (action === "APPROVE") {
        const updated = await tx.withdrawal.updateMany({
          where: {
            id: withdrawal.id,
            status: "PENDING",
          },
          data: {
            status: "APPROVED",
          },
        });

        if (updated.count !== 1) {
          throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
        }

        return {
          action: "APPROVED",
          withdrawalId: withdrawal.id,
        };
      }

      const updated = await tx.withdrawal.updateMany({
        where: {
          id: withdrawal.id,
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
        },
      });

      if (updated.count !== 1) {
        throw new Error("WITHDRAWAL_ALREADY_PROCESSED");
      }

      if (withdrawal.source === "REFERRAL") {
        await tx.user.update({
          where: {
            id: withdrawal.userId,
          },
          data: {
            balance: {
              increment: withdrawal.amount,
            },
          },
        });
      }

      if (withdrawal.source === "TASK") {
        if (!withdrawal.taskId) {
          throw new Error("TASK_ID_MISSING");
        }

        await tx.taskBalance.upsert({
          where: {
            userId_taskId: {
              userId: withdrawal.userId,
              taskId: withdrawal.taskId,
            },
          },
          create: {
            userId: withdrawal.userId,
            taskId: withdrawal.taskId,
            balance: withdrawal.amount,
          },
          update: {
            balance: {
              increment: withdrawal.amount,
            },
          },
        });
      }

      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: "TASK_REWARD",
          amount: withdrawal.amount,
          description:
            withdrawal.source === "TASK"
              ? "Remboursement d'un retrait de tâche rejeté"
              : "Remboursement d'un retrait de parrainage rejeté",
        },
      });

      return {
        action: "REJECTED",
        withdrawalId: withdrawal.id,
      };
    });

    return NextResponse.json({
      success: true,
      message:
        result.action === "APPROVED"
          ? "Le retrait a été approuvé."
          : "Le retrait a été rejeté et le montant a été remboursé.",
      ...result,
    });
  } catch (error) {
    console.error("Admin withdrawals POST error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "UNAUTHORIZED":
          return NextResponse.json(
            { error: "Vous devez être connecté." },
            { status: 401 }
          );

        case "FORBIDDEN":
          return NextResponse.json(
            { error: "Accès administrateur requis." },
            { status: 403 }
          );

        case "WITHDRAWAL_NOT_FOUND":
          return NextResponse.json(
            { error: "Retrait introuvable." },
            { status: 404 }
          );

        case "WITHDRAWAL_ALREADY_PROCESSED":
          return NextResponse.json(
            {
              error:
                "Ce retrait a déjà été traité par un administrateur.",
            },
            { status: 400 }
          );

        case "TASK_ID_MISSING":
          return NextResponse.json(
            {
              error:
                "Impossible de rembourser ce retrait de tâche : tâche introuvable.",
            },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du traitement du retrait.",
      },
      { status: 500 }
    );
  }
}