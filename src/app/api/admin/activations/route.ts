import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * GET
 * Retourne les activations en attente.
 */
export async function GET() {
  try {
    await requireAdmin();

    const activations = await prisma.activation.findMany({
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
        status: true,
        proof: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            referralCode: true,
            referredById: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      activations,
    });
  } catch (error) {
    console.error("Erreur récupération activations:", error);

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "Accès administrateur requis." },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Une erreur interne est survenue." },
      { status: 500 }
    );
  }
}

/**
 * POST
 * Valide une activation et crédite les commissions de parrainage.
 *
 * Commissions :
 * Niveau 1 = 1 500 FCFA
 * Niveau 2 =   700 FCFA
 * Niveau 3 =   300 FCFA
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const userId = String(body.userId || "").trim();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "L'identifiant de l'utilisateur est requis.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          referredById: true,
          activation: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      if (!user.activation) {
        throw new Error("ACTIVATION_NOT_FOUND");
      }

      if (user.activation.status !== "PENDING") {
        throw new Error("ACTIVATION_ALREADY_PROCESSED");
      }

      /*
       * On verrouille logiquement le traitement dans une transaction.
       * L'activation est d'abord marquée ACTIVE et le compte activé.
       */
      await tx.activation.update({
        where: {
          id: user.activation.id,
        },
        data: {
          status: "ACTIVE",
        },
      });

      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          isActive: true,
        },
      });

      const commissions = [
        {
          level: 1,
          amount: 1500,
          description: `Commission niveau 1 - activation de ${user.name}`,
        },
        {
          level: 2,
          amount: 700,
          description: `Commission niveau 2 - activation de ${user.name}`,
        },
        {
          level: 3,
          amount: 300,
          description: `Commission niveau 3 - activation de ${user.name}`,
        },
      ];

      const credited: Array<{
        level: number;
        userId: string;
        amount: number;
      }> = [];

      /*
       * Niveau 1
       */
      if (user.referredById) {
        const level1 = await tx.user.findUnique({
          where: {
            id: user.referredById,
          },
          select: {
            id: true,
            referredById: true,
          },
        });

        if (level1) {
          await tx.user.update({
            where: {
              id: level1.id,
            },
            data: {
              balance: {
                increment: 1500,
              },
            },
          });

          await tx.transaction.create({
            data: {
              userId: level1.id,
              type: "REFERRAL_LEVEL_1",
              amount: 1500,
              description: commissions[0].description,
            },
          });

          credited.push({
            level: 1,
            userId: level1.id,
            amount: 1500,
          });

          /*
           * Niveau 2
           */
          if (level1.referredById) {
            const level2 = await tx.user.findUnique({
              where: {
                id: level1.referredById,
              },
              select: {
                id: true,
                referredById: true,
              },
            });

            if (level2) {
              await tx.user.update({
                where: {
                  id: level2.id,
                },
                data: {
                  balance: {
                    increment: 700,
                  },
                },
              });

              await tx.transaction.create({
                data: {
                  userId: level2.id,
                  type: "REFERRAL_LEVEL_2",
                  amount: 700,
                  description: commissions[1].description,
                },
              });

              credited.push({
                level: 2,
                userId: level2.id,
                amount: 700,
              });

              /*
               * Niveau 3
               */
              if (level2.referredById) {
                const level3 = await tx.user.findUnique({
                  where: {
                    id: level2.referredById,
                  },
                  select: {
                    id: true,
                  },
                });

                if (level3) {
                  await tx.user.update({
                    where: {
                      id: level3.id,
                    },
                    data: {
                      balance: {
                        increment: 300,
                      },
                    },
                  });

                  await tx.transaction.create({
                    data: {
                      userId: level3.id,
                      type: "REFERRAL_LEVEL_3",
                      amount: 300,
                      description: commissions[2].description,
                    },
                  });

                  credited.push({
                    level: 3,
                    userId: level3.id,
                    amount: 300,
                  });
                }
              }
            }
          }
        }
      }

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "ACTIVATION",
          amount: user.activation.amount,
          description: "Activation du compte",
        },
      });

      return {
        userId: user.id,
        userName: user.name,
        commissions: credited,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Activation validée avec succès.",
      data: result,
    });
  } catch (error) {
    console.error("Erreur validation activation:", error);

    if (error instanceof Error) {
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          {
            success: false,
            message: "Accès administrateur requis.",
          },
          { status: 403 }
        );
      }

      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            message: "Utilisateur non connecté.",
          },
          { status: 401 }
        );
      }

      if (error.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Utilisateur introuvable.",
          },
          { status: 404 }
        );
      }

      if (error.message === "ACTIVATION_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            message: "Activation introuvable.",
          },
          { status: 404 }
        );
      }

      if (error.message === "ACTIVATION_ALREADY_PROCESSED") {
        return NextResponse.json(
          {
            success: false,
            message: "Cette activation a déjà été traitée.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Une erreur interne est survenue.",
      },
      { status: 500 }
    );
  }
}
