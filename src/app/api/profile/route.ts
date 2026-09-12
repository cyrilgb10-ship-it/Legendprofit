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

    const profile = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        balance: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: profile,
    });
  } catch (error) {
    console.error("Profile API error:", error);

    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors du chargement de votre compte.",
      },
      { status: 500 }
    );
  }
}