import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVATION_AMOUNT = 3500;
const CURRENCY = "XOF";

const ALLOWED_NETWORKS = [
  "mixx_tg",
  "moov_tg",
  "togocel",
] as const;

type AllowedNetwork = (typeof ALLOWED_NETWORKS)[number];

type SasPayResponse = {
  id?: string;
  status?: string;
  message?: string;
  checkout_url?: string;
  detail?: string;
  error?: string;
};

function normalizePhone(value: string): string | null {
  let phone = value.replace(/[\s().-]/g, "");

  if (phone.startsWith("00228")) {
    phone = `+${phone.slice(2)}`;
  } else if (phone.startsWith("228")) {
    phone = `+${phone}`;
  } else if (!phone.startsWith("+")) {
    phone = `+228${phone}`;
  }

  if (!/^\+228\d{8}$/.test(phone)) {
    return null;
  }

  return phone;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    first_name: parts[0] || "Client",
    last_name: parts.slice(1).join(" ") || "LegendProfit",
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    // 1. Vérifier la session de l'utilisateur.
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "Vous devez vous connecter pour effectuer ce paiement.",
        401
      );
    }

    // 2. Lire et valider les informations envoyées.
    let body: {
      network?: unknown;
      paymentPhone?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonError("Les données envoyées sont invalides.", 400);
    }

    if (
      typeof body.network !== "string" ||
      !ALLOWED_NETWORKS.includes(body.network as AllowedNetwork)
    ) {
      return jsonError("Veuillez sélectionner un réseau valide.", 400);
    }

    if (
      typeof body.paymentPhone !== "string" ||
      body.paymentPhone.trim().length === 0
    ) {
      return jsonError(
        "Veuillez renseigner le numéro Mobile Money.",
        400
      );
    }

    const network = body.network as AllowedNetwork;
    const paymentPhone = normalizePhone(body.paymentPhone);

    if (!paymentPhone) {
      return jsonError(
        "Le numéro doit être un numéro togolais valide de 8 chiffres, avec ou sans indicatif +228.",
        400
      );
    }

    // 3. Vérifier la configuration SasPay.
    const apiUrl = (
      process.env.SASPAY_API_URL ||
      "https://api.saspay.me/api/v1"
    ).replace(/\/+$/, "");

    const secretKey = process.env.SASPAY_SECRET_KEY;

    if (!secretKey) {
      console.error("Configuration manquante : SASPAY_SECRET_KEY");

      return jsonError(
        "Le service de paiement est temporairement indisponible.",
        500
      );
    }

    // 4. Vérifier que l'utilisateur doit encore activer son compte.
    const activation = await prisma.activation.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!activation) {
      return jsonError(
        "Aucune demande d'activation n'a été trouvée pour votre compte.",
        404
      );
    }

    if (user.isActive || activation.status === "ACTIVE") {
      return jsonError(
        "Votre compte est déjà activé.",
        400
      );
    }

    if (activation.status !== "PENDING") {
      return jsonError(
        "Votre demande d'activation n'est pas en attente de paiement.",
        400
      );
    }

    if (activation.amount !== ACTIVATION_AMOUNT) {
      console.error(
        "Montant d'activation inattendu :",
        activation.amount
      );

      return jsonError(
        "Impossible de préparer le paiement. Contactez le support.",
        500
      );
    }

    // 5. Réutiliser une tentative encore en attente.
    // Cela évite de créer plusieurs paiements lorsqu'un utilisateur
    // clique plusieurs fois ou qu'une requête précédente expire.

    let payment = await prisma.activationPayment.findFirst({
      where: {
        userId: user.id,
        activationId: activation.id,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (payment) {
      if (
        payment.network !== network ||
        payment.paymentPhone !== paymentPhone
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Une tentative de paiement est déjà en attente. Utilisez le même réseau et le même numéro ou attendez la confirmation de cette tentative.",
            paymentId: payment.id,
          },
          { status: 409 }
        );
      }

      // Si SasPay a déjà accepté la demande, ne pas en créer une autre.
      if (payment.providerPaymentId) {
        return NextResponse.json({
          success: true,
          message:
            "Votre demande de paiement est en cours de traitement. Vérifiez votre téléphone pour confirmer le paiement.",
          paymentId: payment.id,
          checkoutUrl: payment.checkoutUrl,
          checkout_url: payment.checkoutUrl,
        });
      }
    } else {
      // 6. Créer une tentative locale avec une clé d'idempotence.
      payment = await prisma.activationPayment.create({
        data: {
          userId: user.id,
          activationId: activation.id,
          amount: ACTIVATION_AMOUNT,
          currency: CURRENCY,
          network,
          paymentPhone,
          idempotencyKey: randomUUID(),
          status: "PENDING",
        },
      });
    }

    // 7. Préparer les informations client côté serveur.
    const customerName = splitName(user.name);

    const payload = {
      amount: ACTIVATION_AMOUNT.toFixed(2),
      currency: CURRENCY,
      country: "TG",
      description: "Activation du compte LegendProfit",
      customer: {
        email: user.email,
        first_name: customerName.first_name,
        last_name: customerName.last_name,
        phone: paymentPhone,
      },
      network,
    };

    // 8. Créer le paiement chez SasPay.
    // On conserve la même clé si cette tentative doit être réessayée.
    let providerResponse: Response;

    try {
      providerResponse = await fetch(
        `${apiUrl}/payments/softpay/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": payment.idempotencyKey,
          },
          body: JSON.stringify(payload),
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        }
      );
    } catch (error) {
      // Une interruption réseau ne prouve pas que SasPay a refusé
      // le paiement. On conserve la tentative pour la réessayer
      // avec la même clé d'idempotence.
      console.error(
        "Erreur réseau lors de la demande SasPay :",
        error instanceof Error ? error.message : "Erreur inconnue"
      );

      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "Nous n'avons pas pu confirmer la réponse du service de paiement. Ne recommencez pas avec un autre numéro. Réessayez avec les mêmes informations.",
        },
        { status: 502 }
      );
    }

    const rawResponse = await providerResponse.text();

    let providerData: SasPayResponse = {};

    try {
      providerData = rawResponse
        ? (JSON.parse(rawResponse) as SasPayResponse)
        : {};
    } catch {
      providerData = {};
    }

    // 9. Traiter les erreurs explicites du fournisseur.
    if (!providerResponse.ok) {
      console.error("SasPay a refusé la demande de paiement.", {
        httpStatus: providerResponse.status,
        paymentId: payment.id,
        providerMessage:
          providerData.detail || providerData.message || providerData.error,
      });

      // Ne pas marquer automatiquement FAILED :
      // une réponse d'erreur ou un délai dépassé ne garantit pas
      // que le fournisseur n'a pas créé la transaction.
      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "Le service de paiement n'a pas confirmé la création de la demande. Réessayez avec les mêmes informations.",
        },
        { status: 502 }
      );
    }

    // 10. Enregistrer l'identifiant fournisseur.
    if (!providerData.id) {
      console.error(
        "Réponse SasPay sans identifiant de paiement.",
        {
          paymentId: payment.id,
          httpStatus: providerResponse.status,
        }
      );

      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "La réponse du service de paiement est incomplète. Votre demande doit être vérifiée avant toute nouvelle tentative.",
        },
        { status: 502 }
      );
    }

    const checkoutUrl =
      typeof providerData.checkout_url === "string" &&
      providerData.checkout_url.trim() !== ""
        ? providerData.checkout_url
        : null;

    await prisma.activationPayment.update({
      where: {
        id: payment.id,
      },
      data: {
        providerPaymentId: providerData.id,
        checkoutUrl,
        status: "PENDING",
      },
    });

    // 11. Confirmer la création de la demande, pas le paiement.
    // Le compte reste inactif tant que le paiement n'a pas été
    // vérifié auprès de SasPay.
    return NextResponse.json({
      success: true,
      message:
        "Demande de paiement créée. Confirmez le paiement sur votre téléphone si vous recevez une notification Mobile Money.",
      paymentId: payment.id,
      checkoutUrl,
      checkout_url: checkoutUrl,
      status: "PENDING",
    });
  } catch (error) {
    console.error(
      "Erreur interne de création du paiement d'activation :",
      error instanceof Error ? error.message : "Erreur inconnue"
    );

    return jsonError(
      "Une erreur interne est survenue. Veuillez réessayer plus tard.",
      500
    );
  }
}