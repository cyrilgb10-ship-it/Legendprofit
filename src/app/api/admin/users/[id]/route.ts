import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Identifiant utilisateur manquant." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        referralCode: true,
        referredById: true,
        balance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        referredBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            referralCode: true,
            isActive: true,
          },
        },

        referrals: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },

        activation: {
          select: {
            id: true,
            amount: true,
            status: true,
            proof: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
          },
        },

        withdrawals: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            amount: true,
            fee: true,
            netAmount: true,
            method: true,
            account: true,
            source: true,
            taskId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        taskBalances: {
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            taskId: true,
            balance: true,
            createdAt: true,
            updatedAt: true,
            task: {
              select: {
                id: true,
                title: true,
                reward: true,
                isActive: true,
              },
            },
          },
        },

        taskSubmissions: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            taskId: true,
            taskDate: true,
            proof: true,
            status: true,
            reward: true,
            createdAt: true,
            updatedAt: true,
            task: {
              select: {
                id: true,
                title: true,
                reward: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error("Admin user detail GET error:", error);

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
          "Une erreur est survenue lors du chargement de l'utilisateur.",
      },
      { status: 500 }
    );
  }
}
