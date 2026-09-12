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

export async function GET(
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
      select: {
        id: true,
        title: true,
        description: true,
        reward: true,
        dayOfWeek: true,
        isActive: true,
      },
    });

    if (!task || !task.isActive) {
      return NextResponse.json(
        { error: "Cette tâche n'existe pas ou n'est plus active." },
        { status: 404 }
      );
    }

    const now = new Date();
    const currentDay = now.getDay();
    const taskDate = getTodayDate();

    const submission = await prisma.taskSubmission.findUnique({
      where: {
        userId_taskId_taskDate: {
          userId: user.id,
          taskId: task.id,
          taskDate,
        },
      },
      select: {
        id: true,
        status: true,
        reward: true,
      },
    });

    const taskBalance = await prisma.taskBalance.findUnique({
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

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        reward: task.reward,
        balance: taskBalance?.balance ?? 0,
        availableToday:
          currentDay !== 0 &&
          currentDay !== 6 &&
          task.dayOfWeek === currentDay,
        completedToday: Boolean(submission),
      },
    });
  } catch (error) {
    console.error("Erreur récupération tâche :", error);

    return NextResponse.json(
      { error: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}