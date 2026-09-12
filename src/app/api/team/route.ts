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

    const members = await prisma.user.findMany({
      where: {
        referredById: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Team API error:", error);

    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement de votre équipe." },
      { status: 500 }
    );
  }
}