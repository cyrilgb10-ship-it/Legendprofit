import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVATION_AMOUNT = 3500;

type ActivationResult = {
userId: string;
userName: string;
commissions: Array<{
level: number;
userId: string;
amount: number;
}>;
};

export async function activateUserAccount(
userId: string,
expectedActivationId?: string
): Promise<ActivationResult> {
return prisma.$transaction(
async (tx) => {
const user = await tx.user.findUnique({
where: { id: userId },
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

  if (
    expectedActivationId &&
    user.activation.id !== expectedActivationId
  ) {
    throw new Error("ACTIVATION_MISMATCH");
  }

  if (
    user.activation.status !== "PENDING" ||
    user.isActive
  ) {
    throw new Error("ACTIVATION_ALREADY_PROCESSED");
  }

  if (user.activation.amount !== ACTIVATION_AMOUNT) {
    throw new Error("ACTIVATION_AMOUNT_INVALID");
  }

  // Cette mise à jour conditionnelle empêche deux traitements
  // simultanés de valider la même activation.
  const claim = await tx.activation.updateMany({
    where: {
      id: user.activation.id,
      status: "PENDING",
    },
    data: {
      status: "ACTIVE",
    },
  });

  if (claim.count !== 1) {
    throw new Error("ACTIVATION_ALREADY_PROCESSED");
  }

  await tx.user.update({
    where: { id: user.id },
    data: { isActive: true },
  });

  const commissions = [
    {
      level: 1,
      amount: 1500,
      type: "REFERRAL_LEVEL_1" as const,
    },
    {
      level: 2,
      amount: 700,
      type: "REFERRAL_LEVEL_2" as const,
    },
    {
      level: 3,
      amount: 300,
      type: "REFERRAL_LEVEL_3" as const,
    },
  ];

  const credited: ActivationResult["commissions"] = [];
  let referrerId = user.referredById;

  for (const commission of commissions) {
    if (!referrerId) break;

    const referrer = await tx.user.findUnique({
      where: { id: referrerId },
      select: {
        id: true,
        referredById: true,
      },
    });

    if (!referrer) break;

    await tx.user.update({
      where: { id: referrer.id },
      data: {
        balance: { increment: commission.amount },
      },
    });

    await tx.transaction.create({
      data: {
        userId: referrer.id,
        type: commission.type,
        amount: commission.amount,
        description: `Commission niveau ${commission.level} - activation de ${user.name}`,
      },
    });

    credited.push({
      level: commission.level,
      userId: referrer.id,
      amount: commission.amount,
    });

    referrerId = referrer.referredById;
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
},
{
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
}

);
}
