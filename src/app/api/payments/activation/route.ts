import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVATION_AMOUNT = 3500;
const CURRENCY = "XOF";

const ALLOWED_NETWORKS = ["moov_tg", "togocel"] as const;

type AllowedNetwork = (typeof ALLOWED_NETWORKS)[number];

type SasPayResponse = {
  id?: string;
  status?: string;
  message?: string;
  checkout_url?: string;
  detail?: string;
  error?: string;
  code?: string;
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
    { status },
  );
}

function getProviderMessage(data: SasPayResponse): string {
  return data.detail || data.message || data.error || "Erreur SasPay";
}

export async function POST(request: Request) {
  try {
    // 1. Vérifier la session.
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "Vous devez vous connecter pour effectuer ce paiement.",
        401,
      );
    }

    // 2. Lire les informations envoyées.
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
      return jsonError(
        "Veuillez sélectionner Moov Money ou Togocel.",
        400,
      );
    }

    if (
      typeof body.paymentPhone !== "string" ||
      body.paymentPhone.trim() === ""
    ) {
      return jsonError(
        "Veuillez renseigner votre numéro Mobile Money.",
        400,
      );
    }

    const network = body.network as AllowedNetwork;
    const paymentPhone = normalizePhone(body.paymentPhone);

    if (!paymentPhone) {
      return jsonError(
        "Le numéro doit être un numéro togolais valide de 8 chiffres, avec ou sans indicatif +228.",
        400,
      );
    }

    // 3. Vérifier la configuration SasPay.
    const apiUrl = (
      process.env.SASPAY_API_URL || "https://api.saspay.me/api/v1"
    ).replace(/\/+$/, "");

    const secretKey = process.env.SASPAY_SECRET_KEY;

    if (!secretKey) {
      console.error("Configuration manquante : SASPAY_SECRET_KEY");

      return jsonError(
        "Le service de paiement est temporairement indisponible.",
        500,
      );
    }

    // 4. Vérifier l'activation du compte.
    const activation = await prisma.activation.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!activation) {
      return jsonError(
        "Aucune demande d'activation n'a été trouvée pour votre compte.",
        404,
      );
    }

    if (user.isActive || activation.status === "ACTIVE") {
      return jsonError("Votre compte est déjà activé.", 400);
    }

    if (activation.status !== "PENDING") {
      return jsonError(
        "Votre demande d'activation n'est pas en attente de paiement.",
        400,
      );
    }

    if (activation.amount !== ACTIVATION_AMOUNT) {
      console.error("Montant d'activation inattendu :", activation.amount);

      return jsonError(
        "Impossible de préparer le paiement. Contactez le support.",
        500,
      );
    }

    // 5. Chercher la dernière tentative encore en attente.
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
      // Une demande déjà acceptée par SasPay ne doit pas être recréée.
      if (payment.providerPaymentId) {
        if (
          payment.network !== network ||
          payment.paymentPhone !== paymentPhone
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Une demande de paiement est déjà en cours avec un autre réseau ou numéro. Vérifiez son statut avant de lancer une nouvelle demande.",
              paymentId: payment.id,
            },
            { status: 409 },
          );
        }

        return NextResponse.json({
          success: true,
          pending: true,
          message:
            "Une demande de paiement existe déjà. Vérifiez votre téléphone pour confirmer le paiement.",
          paymentId: payment.id,
          checkoutUrl: payment.checkoutUrl,
          checkout_url: payment.checkoutUrl,
          status: "PENDING",
        });
      }

      // Si aucune référence SasPay n'a été enregistrée, nous ne pouvons
      // pas savoir avec certitude si une ancienne requête a été acceptée.
      // Une nouvelle requête pourrait entraîner un double prélèvement.
      //
      // Nous réutilisons donc la même tentative et la même clé
      // d'idempotence pour une nouvelle tentative contrôlée.
      if (
        payment.network !== network ||
        payment.paymentPhone !== paymentPhone
      ) {
        return NextResponse.json(
          {
            success: false,
            pending: true,
            message:
              "Une tentative précédente n'a pas encore été vérifiée. Réutilisez le même réseau et le même numéro pour éviter un double paiement.",
            paymentId: payment.id,
          },
          { status: 409 },
        );
      }
    } else {
      // 6. Créer une nouvelle tentative locale.
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

    // 7. Préparer les informations du client.
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

    // 8. Envoyer la demande à SasPay.
    let providerResponse: Response;

    try {
      providerResponse = await fetch(`${apiUrl}/payments/softpay/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payment.idempotencyKey,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      console.error(
        "Erreur réseau lors de la demande SasPay :",
        error instanceof Error ? error.message : "Erreur inconnue",
      );

      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "La réponse de SasPay n'a pas pu être confirmée. Ne changez pas de numéro et ne relancez pas plusieurs paiements. Vérifiez le statut de cette tentative avant de réessayer.",
        },
        { status: 502 },
      );
    }

    // 9. Lire la réponse du fournisseur.
    const rawResponse = await providerResponse.text();

    let providerData: SasPayResponse = {};

    try {
      providerData = rawResponse
        ? (JSON.parse(rawResponse) as SasPayResponse)
        : {};
    } catch {
      providerData = {};
    }

    // 10. Traiter les refus explicites.
    if (!providerResponse.ok) {
      const providerMessage = getProviderMessage(providerData);

      console.error("SasPay a refusé la demande de paiement.", {
        httpStatus: providerResponse.status,
        paymentId: payment.id,
        providerCode: providerData.code,
        providerMessage,
      });

      /*
       * Un HTTP 422 avec no_route_available est un refus explicite :
       * aucune route n'est disponible pour cette demande.
       *
       * Nous marquons cette tentative FAILED pour ne pas la réutiliser
       * indéfiniment. Une prochaine tentative créera une nouvelle ligne.
       *
       * Les autres erreurs HTTP ne sont pas toutes nécessairement
       * définitives : elles restent à vérifier pour éviter les doublons.
       */
      if (
        providerResponse.status === 422 &&
        providerData.code === "no_route_available"
      ) {
        await prisma.activationPayment.updateMany({
          where: {
            id: payment.id,
            status: "PENDING",
            providerPaymentId: null,
          },
          data: {
            status: "FAILED",
          },
        });

        return NextResponse.json(
          {
            success: false,
            pending: false,
            code: "no_route_available",
            message:
              "SasPay ne dispose actuellement d'aucune route pour ce réseau. Choisissez un autre réseau disponible ou contactez le support SasPay.",
          },
          { status: 422 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "SasPay n'a pas confirmé la création du paiement. Vérifiez le statut de la tentative avant de réessayer.",
        },
        { status: 502 },
      );
    }

    // 11. Vérifier que SasPay a renvoyé une référence.
    if (
      typeof providerData.id !== "string" ||
      providerData.id.trim() === ""
    ) {
      console.error("Réponse SasPay sans identifiant de paiement.", {
        paymentId: payment.id,
        httpStatus: providerResponse.status,
      });

      return NextResponse.json(
        {
          success: false,
          pending: true,
          paymentId: payment.id,
          message:
            "La réponse de SasPay est incomplète. Vérifiez le statut de cette tentative avant d'en créer une autre.",
        },
        { status: 502 },
      );
    }

    const checkoutUrl =
      typeof providerData.checkout_url === "string" &&
      providerData.checkout_url.trim() !== ""
        ? providerData.checkout_url
        : null;

    // 12. Enregistrer la référence SasPay.
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

    // 13. La demande est créée, mais le compte reste inactif
    // jusqu'à la confirmation effective du paiement par SasPay.
    return NextResponse.json({
      success: true,
      pending: true,
      message:
        "Demande de paiement créée. Vérifiez votre téléphone et confirmez le paiement si une notification Mobile Money est envoyée.",
      paymentId: payment.id,
      checkoutUrl,
      checkout_url: checkoutUrl,
      status: "PENDING",
    });
  } catch (error) {
    console.error(
      "Erreur interne de création du paiement d'activation :",
      error instanceof Error ? error.message : "Erreur inconnue",
    );

    return jsonError(
      "Une erreur interne est survenue. Veuillez réessayer plus tard.",
      500,
    );
  }
}
