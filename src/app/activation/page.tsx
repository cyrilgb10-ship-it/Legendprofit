"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentNetwork = {
  id: string;
  code: string;
  name: string;
};

type PaymentResponse = {
  success?: boolean;
  message?: string;
  checkoutUrl?: string;
  checkout_url?: string;
  paymentId?: string;
  payment_id?: string;
};

export default function ActivationPage() {
  const [user, setUser] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const [paymentPhone, setPaymentPhone] = useState("");
  const [networks, setNetworks] = useState<PaymentNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");

  const [loadingNetworks, setLoadingNetworks] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "legendprofit_pending_activation"
    );

    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);

        const accountUser = {
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        };

        setUser(accountUser);
        setPaymentPhone(accountUser.phone);
      } catch {
        localStorage.removeItem("legendprofit_pending_activation");
      }
    }

    async function loadNetworks() {
      try {
        const response = await fetch("/api/payments/networks", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Impossible de charger les réseaux de paiement."
          );
        }

        const availableNetworks: PaymentNetwork[] = Array.isArray(
          data.networks
        )
          ? data.networks.filter(
              (network: PaymentNetwork) =>
                network.id && network.code && network.name
            )
          : [];

        setNetworks(availableNetworks);

        if (availableNetworks.length > 0) {
          setSelectedNetwork(availableNetworks[0].code);
        } else {
          setError("Aucun réseau de paiement n'est disponible.");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les réseaux de paiement."
        );
      } finally {
        setLoadingNetworks(false);
      }
    }

    void loadNetworks();
  }, []);

  async function activateAccount() {
    setError("");
    setMessage("");

    const normalizedPhone = paymentPhone.trim();

    if (!normalizedPhone) {
      setError("Veuillez saisir votre numéro de paiement.");
      return;
    }

    if (!selectedNetwork) {
      setError("Veuillez choisir un réseau de paiement.");
      return;
    }

    if (normalizedPhone.replace(/\D/g, "").length < 8) {
      setError("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setLoadingPayment(true);

    try {
      const response = await fetch("/api/payments/activation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          network: selectedNetwork,
          paymentPhone: normalizedPhone,
        }),
      });

      const data: PaymentResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Impossible d'initialiser le paiement."
        );
      }

      const checkoutUrl = data.checkoutUrl || data.checkout_url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      setMessage(
        data.message ||
          "La demande a été envoyée. Suivez les instructions de confirmation du paiement."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la préparation du paiement."
      );
    } finally {
      setLoadingPayment(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        {/* EN-TÊTE */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight text-emerald-400"
          >
            Legend<span className="text-white">Profit</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold">
            Activez votre compte
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Effectuez le paiement pour finaliser l'activation
            de votre compte.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.04] p-6 shadow-2xl">
          {/* MONTANT */}
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <p className="text-sm text-gray-400">
              Frais d'activation
            </p>

            <p className="mt-2 text-4xl font-black text-emerald-400">
              3 500 FCFA
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Paiement unique
            </p>
          </div>

          {/* INFORMATIONS PERSONNELLES MASQUÉES */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-emerald-400">
              Informations du compte
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Vos informations personnelles sont conservées
              pour le traitement de votre activation et ne sont
              pas affichées sur cette page.
            </p>
          </div>

          {/* NUMÉRO DE PAIEMENT */}
          <div className="mt-6">
            <label
              htmlFor="paymentPhone"
              className="mb-2 block text-sm font-semibold"
            >
              Numéro de paiement
            </label>

            <input
              id="paymentPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={paymentPhone}
              onChange={(event) =>
                setPaymentPhone(event.target.value)
              }
              placeholder="Ex. : 90 00 00 00"
              required
              maxLength={20}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-emerald-400"
            />

            <p className="mt-2 text-xs text-gray-500">
              Saisissez le numéro Mobile Money que vous souhaitez
              utiliser pour payer les frais d'activation.
            </p>
          </div>

          {/* RÉSEAUX DE PAIEMENT */}
          <div className="mt-6">
            <p className="mb-3 block text-sm font-semibold">
              Choisissez votre réseau Mobile Money
            </p>

            {loadingNetworks ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
                Chargement des réseaux de paiement...
              </div>
            ) : networks.length > 0 ? (
              <div className="space-y-3">
                {networks.map((network) => (
                  <label
                    key={network.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      selectedNetwork === network.code
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="network"
                      value={network.code}
                      checked={selectedNetwork === network.code}
                      onChange={() =>
                        setSelectedNetwork(network.code)
                      }
                      className="h-4 w-4 accent-emerald-400"
                    />

                    <span className="font-medium">
                      {network.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                Aucun réseau de paiement disponible pour le moment.
              </div>
            )}
          </div>

          {/* CODE SECRET */}
          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm font-semibold text-yellow-400">
              Confirmation sécurisée
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Après l'initialisation du paiement, suivez les
              instructions officielles de votre opérateur pour
              confirmer la transaction. Ne communiquez jamais
              votre code PIN Mobile Money à LegendProfit.
            </p>
          </div>

          {/* ERREURS */}
          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300"
            >
              {message}
            </div>
          )}

          {/* BOUTON */}
          <button
            type="button"
            onClick={activateAccount}
            disabled={
              loadingNetworks ||
              loadingPayment ||
              networks.length === 0 ||
              !selectedNetwork
            }
            className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-4 font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingPayment
              ? "Préparation du paiement..."
              : "Payer 3 500 FCFA"}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            Votre compte sera activé uniquement après vérification
            du paiement par le serveur.
          </p>
        </div>

        {/* RETOUR */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}