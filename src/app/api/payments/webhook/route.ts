import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { activateUserAccount } from "@/lib/activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVATION_AMOUNT = 3500;
const CURRENCY = "XOF";
const TOLERANCE_SECONDS = 300;

type SasPayWebhook = {
  event?: string;
  data?: {
    id?: string;
    reference?: string;
    type?: string;
    status?: string;
    amount?: string | number;
    currency?: string;
    country?: string;
    network?: string;
    msisdn?: string;
  };
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function verifySignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) return false;

  if (!/^\d{1,12}$/.test(timestamp)) return false;

  const timestampNumber = Number(timestamp);

  if (!Number.isSafeInteger(timestampNumber)) return false;

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - timestampNumber) > TOLERANCE_SECONDS) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest();

  const received = Buffer.from(signature, "hex");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SASPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("SASPAY_WEBHOOK_SECRET n'est pas configuré.");
    return jsonError("Configuration du webhook indisponible.", 500);
  }

  const rawBody = await request.text();

  const signature = request.headers.get("x-webhook-signature");
  const timestamp = request.headers.get("x-webhook-timestamp");
  const eventHeader = request.headers.get("x-webhook-event");

  if (
    !verifySignature(
      rawBody,
      signature,
      timestamp,
      secret
    )
  ) {
    return jsonError("Signature du webhook invalide.", 401);
  }

  let payload: SasPayWebhook;

  try {
    payload = JSON.parse(rawBody) as SasPayWebhook;
  } catch {
    return jsonError("Corps JSON invalide.", 400);
  }

  if (!payload.event || !payload.data) {
    return jsonError("Notification incomplète.", 400);
  }

  if (eventHeader !== payload.event) {
    return jsonError("Type d'événement incohérent.", 400);
  }

  // Les événements sans rapport avec une activation sont ignorés.
  if (payload.event !== "transaction.success") {
    return NextResponse.json({
      success: true,
      received: true,
      ignored: true,
    });
  }

  const data = payload.data;

  if (!data.id) {
    return jsonError("Identifiant de transaction manquant.", 400);
  }

  if (
    data.status !== "SUCCESS" ||
    data.type !== "PAIEMENT" ||
    data.currency !== CURRENCY ||
    Number(data.amount) !== ACTIVATION_AMOUNT ||
    data.country !== "TG"
  ) {
    // Une transaction différente des critères d'activation
    // ne doit jamais activer un compte.
    return NextResponse.json({
      success: true,
      received: true,
      ignored: true,
    });
  }

  try {
    const payment = await prisma.activationPayment.findFirst({
      where: {
        providerPaymentId: data.id,
        amount: ACTIVATION_AMOUNT,
        currency: CURRENCY,
      },
      select: {
        id: true,
        userId: true,
        activationId: true,
        status: true,
        network: true,
        paymentPhone: true,
      },
    });

    if (!payment) {
      console.error(
        "Webhook SasPay reçu pour un paiement local introuvable.",
        { providerPaymentId: data.id }
      );

      // Une erreur temporaire permet à SasPay de retenter
      // la livraison plutôt que de perdre la notification.
      return jsonError("Paiement local introuvable.", 503);
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        received: true,
        alreadyProcessed: true,
      });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({
        success: true,
        received: true,
        ignored: true,
      });
    }

    // Contrôle complémentaire auprès de SasPay :
    // la notification signée ne suffit pas à elle seule.
    const apiSecret = process.env.SASPAY_SECRET_KEY;

    if (!apiSecret) {
      console.error("SASPAY_SECRET_KEY n'est pas configuré.");
      return jsonError("Vérification du paiement indisponible.", 503);
    }

    const apiUrl = (
      process.env.SASPAY_API_URL ||
      "https://api.saspay.me/api/v1"
    ).replace(/\/+$/, "");

    const verifyResponse = await fetch(
      `${apiUrl}/payments/${encodeURIComponent(data.id)}/verify/`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiSecret}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!verifyResponse.ok) {
      console.error("Échec de la vérification du paiement auprès de SasPay.", {
        status: verifyResponse.status,
        paymentId: payment.id,
      });

      return jsonError("Vérification du paiement impossible.", 503);
    }

    const verified = (await verifyResponse.json()) as {
      id?: string;
      status?: string;
      requested_amount?: string | number;
      amount?: string | number;
      currency?: string;
    };

    const verifiedAmount = Number(
      verified.requested_amount ?? verified.amount
    );

    if (
      verified.id !== data.id ||
      verified.status?.toUpperCase() !== "SUCCESS" ||
      verifiedAmount !== ACTIVATION_AMOUNT ||
      verified.currency !== CURRENCY
    ) {
      console.error("Les données vérifiées du paiement ne correspondent pas.", {
        paymentId: payment.id,
      });

      return jsonError("Paiement non confirmé par le prestataire.", 503);
    }

    // Vérifier que la demande d'activation correspond toujours
    // à cet utilisateur et qu'elle attend encore son activation.
    const activation = await prisma.activation.findFirst({
      where: {
        id: payment.activationId,
        userId: payment.userId,
        status: "PENDING",
        amount: ACTIVATION_AMOUNT,
      },
      select: {
        id: true,
      },
    });

    if (!activation) {
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { isActive: true },
      });

      if (user?.isActive) {
        await prisma.activationPayment.updateMany({
          where: {
            id: payment.id,
            status: "PENDING",
          },
          data: { status: "SUCCESS" },
        });

        return NextResponse.json({
          success: true,
          received: true,
          alreadyActivated: true,
        });
      }

      return jsonError("Demande d'activation introuvable.", 503);
    }

    // L'activation et les commissions sont protégées contre
    // les doubles traitements par la fonction partagée.
    await activateUserAccount(payment.userId, activation.id);

    // Marquer le paiement comme traité uniquement après
    // la réussite de l'activation.
    const updated = await prisma.activationPayment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "SUCCESS",
      },
    });

    if (updated.count !== 1) {
      console.error(
        "Activation effectuée, mais statut du paiement à réconcilier.",
        { paymentId: payment.id }
      );

      return jsonError("Traitement à réconcilier.", 503);
    }

    return NextResponse.json({
      success: true,
      received: true,
      activated: true,
    });
  } catch (error) {
    console.error(
      "Erreur de traitement du webhook SasPay.",
      error instanceof Error ? error.message : "Erreur inconnue"
    );

    return jsonError("Erreur temporaire de traitement.", 503);
  }
}