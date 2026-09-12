import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error: "Compte non activé",
          redirectTo: "/activation",
        },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        reward: true,
        balances: {
          where: {
            userId: user.id,
          },
          select: {
            balance: true,
          },
        },
      },
    });

    const referrals = await prisma.user.count({
      where: {
        referredById: user.id,
      },
    });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,

        // Solde de parrainage uniquement.
        balance: user.balance,

        isActive: user.isActive,
      },

      referrals,

      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        reward: task.reward,

        // Solde propre à cette tâche.
        balance: task.balances[0]?.balance ?? 0,
      })),

      transactions,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}