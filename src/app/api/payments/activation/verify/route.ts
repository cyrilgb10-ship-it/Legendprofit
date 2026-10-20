import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { activateUserAccount } from "@/lib/activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVATION_AMOUNT = 3500;
const CURRENCY = "XOF";

type SasPayVerification = {
id?: string;
status?: string;
requested_amount?: string | number;
amount?: string | number;
currency?: string;
};

function jsonError(message: string, status: number) {
return NextResponse.json(
{ success: false, message },
{ status }
);
}

export async function POST() {
try {
const user = await getCurrentUser();


if (!user) {
  return jsonError("Vous devez vous connecter.", 401);
}

const activation = await prisma.activation.findUnique({
  where: { userId: user.id },
  select: {
    id: true,
    amount: true,
    status: true,
  },
});

if (!activation) {
  return jsonError("Demande d'activation introuvable.", 404);
}

if (activation.status === "ACTIVE" && user.isActive) {
  return NextResponse.json({
    success: true,
    status: "SUCCESS",
    activated: true,
    message: "Votre compte est déjà activé.",
  });
}

if (activation.status !== "PENDING") {
  return jsonError(
    "Cette demande d'activation n'est plus en attente.",
    400
  );
}

if (activation.amount !== ACTIVATION_AMOUNT) {
  return jsonError(
    "Le montant d'activation configuré est incorrect.",
    500
  );
}

const payment = await prisma.activationPayment.findFirst({
  where: {
    userId: user.id,
    activationId: activation.id,
    status: "PENDING",
    providerPaymentId: { not: null },
  },
  orderBy: { createdAt: "desc" },
});

if (!payment?.providerPaymentId) {
  return jsonError(
    "Aucun paiement SasPay vérifiable n'a été trouvé. Initialisez d'abord votre paiement.",
    404
  );
}

const secretKey = process.env.SASPAY_SECRET_KEY;

if (!secretKey) {
  console.error("Configuration manquante : SASPAY_SECRET_KEY");
  return jsonError(
    "Le service de paiement est temporairement indisponible.",
    503
  );
}

const apiUrl = (
  process.env.SASPAY_API_URL ||
  "https://api.saspay.me/api/v1"
).replace(/\/+$/, "");

const response = await fetch(
  `${apiUrl}/payments/${encodeURIComponent(payment.providerPaymentId)}/verify/`,
  {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  }
);

if (!response.ok) {
  console.error("Échec de la vérification SasPay.", {
    httpStatus: response.status,
    localPaymentId: payment.id,
  });

  return jsonError(
    "Impossible de vérifier le paiement auprès de SasPay. Réessayez plus tard.",
    response.status === 404 ? 502 : 503
  );
}

const result =
  (await response.json()) as SasPayVerification;

// Vérification de l'identifiant et des caractéristiques du paiement.
if (result.id !== payment.providerPaymentId) {
  console.error("Identifiant de paiement SasPay incohérent.", {
    localPaymentId: payment.id,
  });

  return jsonError(
    "La réponse du prestataire ne correspond pas à votre paiement.",
    502
  );
}

const amountValue =
  result.requested_amount ?? result.amount;

const amount = Number(amountValue);

if (
  !Number.isFinite(amount) ||
  amount !== ACTIVATION_AMOUNT ||
  result.currency !== CURRENCY ||
  payment.amount !== ACTIVATION_AMOUNT ||
  payment.currency !== CURRENCY
) {
  console.error("Caractéristiques de paiement incohérentes.", {
    localPaymentId: payment.id,
    amount: amountValue,
    currency: result.currency,
  });

  return jsonError(
    "Le montant ou la devise du paiement ne correspond pas aux frais d'activation.",
    400
  );
}

const status = String(result.status || "").toUpperCase();

if (status === "PENDING") {
  return NextResponse.json({
    success: true,
    status: "PENDING",
    activated: false,
    message:
      "Votre paiement est toujours en cours de traitement. Réessayez dans quelques instants.",
  });
}

if (status === "FAILED" || status === "EXPIRED") {
  await prisma.activationPayment.updateMany({
    where: {
      id: payment.id,
      status: "PENDING",
    },
    data: {
      status,
    },
  });

  return NextResponse.json({
    success: true,
    status,
    activated: false,
    message:
      status === "FAILED"
        ? "Le paiement a échoué. Si votre compte a été débité, contactez le support avant de réessayer."
        : "La demande de paiement a expiré. Vous pouvez initialiser une nouvelle demande.",
  });
}

if (status !== "SUCCESS") {
  console.error("Statut SasPay non reconnu.", {
    localPaymentId: payment.id,
    status,
  });

  return jsonError(
    "Le statut reçu du prestataire n'est pas reconnu. Contactez le support si le problème persiste.",
    502
  );
}

// La transaction active le compte et crédite les commissions
// uniquement si l'activation est encore en attente.
const activationResult = await activateUserAccount(
  user.id,
  activation.id
);

// Enregistrer le succès après l'activation.
// Si cette mise à jour échoue, le paiement restera à vérifier,
// mais le compte ne sera pas activé une seconde fois.
await prisma.activationPayment.updateMany({
  where: {
    id: payment.id,
    status: "PENDING",
  },
  data: {
    status: "SUCCESS",
  },
});

return NextResponse.json({
  success: true,
  status: "SUCCESS",
  activated: true,
  message: "Paiement confirmé ! Votre compte est activé.",
  data: activationResult,
});

} catch (error) {
if (
error instanceof Error &&
error.message === "ACTIVATION_ALREADY_PROCESSED"
) {
const user = await getCurrentUser();


  if (user) {
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isActive: true },
    });

    if (refreshed?.isActive) {
      return NextResponse.json({
        success: true,
        status: "SUCCESS",
        activated: true,
        message: "Votre compte est déjà activé.",
      });
    }
  }
}

console.error(
  "Erreur de vérification du paiement d'activation :",
  error instanceof Error ? error.message : "Erreur inconnue"
);

return jsonError(
  "Une erreur est survenue pendant la vérification. Réessayez plus tard.",
  500
);

}
}
