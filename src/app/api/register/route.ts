import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function generateReferralCode(name: string) {
  const cleanName = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  const random = Math.floor(1000 + Math.random() * 9000);

  return `${cleanName || "LEGEND"}${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const referralCode = String(body.referralCode || "").trim().toUpperCase();

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Veuillez remplir tous les champs obligatoires.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Le nom doit contenir au moins 2 caracteres.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Le mot de passe doit contenir au moins 8 caracteres.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          {
            success: false,
            message: "Cette adresse email est deja utilisee.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Ce numero de telephone est deja utilise.",
        },
        { status: 409 }
      );
    }

    let referredById: string | undefined;

    if (referralCode) {
      const sponsor = await prisma.user.findUnique({
        where: {
          referralCode,
        },
        select: {
          id: true,
        },
      });

      if (!sponsor) {
        return NextResponse.json(
          {
            success: false,
            message: "Le code de parrainage est invalide.",
          },
          { status: 400 }
        );
      }

      referredById = sponsor.id;
    }

    let generatedReferralCode = generateReferralCode(name);

    while (
      await prisma.user.findUnique({
        where: {
          referralCode: generatedReferralCode,
        },
      })
    ) {
      generatedReferralCode = generateReferralCode(name);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        referralCode: generatedReferralCode,
        referredById,
        isActive: false,
        activation: {
          create: {
            amount: 4000,
            status: "PENDING",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referralCode: true,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Compte cree avec succes.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur inscription:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur interne est survenue.",
      },
      { status: 500 }
    );
  }
}
