import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          error: "Compte non activé.",
          redirectTo: "/activation",
        },
        { status: 403 }
      );
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
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
    });

    return NextResponse.json({
      transactions,
    });
  } catch (error) {
    console.error("Transactions API error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du chargement de vos transactions.",
      },
      { status: 500 }
    );
  }
}