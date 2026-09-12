import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

function getTodayDate() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: "Votre compte n'est pas encore actif." },
        { status: 403 }
      );
    }

    const { id: taskId } = await params;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task || !task.isActive) {
      return NextResponse.json(
        { error: "Cette tâche n'existe pas ou n'est plus active." },
        { status: 404 }
      );
    }

    const now = new Date();

    // Dimanche = 0, lundi = 1, ..., vendredi = 5, samedi = 6
    const currentDay = now.getDay();

    if (currentDay === 0 || currentDay === 6) {
      return NextResponse.json(
        { error: "Aucune tâche n'est disponible le week-end." },
        { status: 400 }
      );
    }

    if (task.dayOfWeek !== currentDay) {
      return NextResponse.json(
        { error: "Cette tâche n'est pas disponible aujourd'hui." },
        { status: 400 }
      );
    }

    const taskDate = getTodayDate();

    const existingSubmission = await prisma.taskSubmission.findUnique({
      where: {
        userId_taskId_taskDate: {
          userId: user.id,
          taskId: task.id,
          taskDate,
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          error: "Vous avez déjà effectué cette tâche aujourd'hui.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.taskSubmission.create({
        data: {
          userId: user.id,
          taskId: task.id,
          taskDate,
          status: "APPROVED",
          reward: task.reward,
        },
      });

      const taskBalance = await tx.taskBalance.upsert({
        where: {
          userId_taskId: {
            userId: user.id,
            taskId: task.id,
          },
        },
        update: {
          balance: {
            increment: task.reward,
          },
        },
        create: {
          userId: user.id,
          taskId: task.id,
          balance: task.reward,
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "TASK_REWARD",
          amount: task.reward,
          description: `Récompense de la tâche ${task.title}`,
        },
      });

      return {
        submission,
        taskBalance,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Félicitations ! ${task.reward} FCFA ont été ajoutés au solde ${task.title}.`,
      reward: task.reward,
      taskBalance: result.taskBalance.balance,
    });
  } catch (error) {
    console.error("Erreur completion tâche :", error);

    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}