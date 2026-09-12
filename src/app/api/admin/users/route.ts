import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
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
        _count: {
          select: {
            referrals: true,
            withdrawals: true,
            transactions: true,
            taskSubmissions: true,
          },
        },
      },
    });

    return NextResponse.json({
      users,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);

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
        error: "Une erreur est survenue lors du chargement des utilisateurs.",
      },
      { status: 500 }
    );
  }
}
