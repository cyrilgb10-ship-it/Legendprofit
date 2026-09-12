"use client";

import { useEffect, useState } from "react";

type Activation = {
  id: string;
  userId: string;
  amount: number;
  status: string;
  proof: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    referredById: string | null;
    isActive: boolean;
  };
};

export default function AdminActivationsPage() {
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadActivations() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/activations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de récupérer les activations.");
      }

      setActivations(data.activations || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivations();
  }, []);

  async function validateActivation(userId: string) {
    const confirmed = window.confirm(
      "Confirmer la validation de cette activation ?\n\n" +
        "Le compte sera activé et les commissions de parrainage seront distribuées."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(userId);
      setMessage("");
      setError("");

      const response = await fetch("/api/admin/activations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Impossible de valider l'activation."
        );
      }

      setMessage(data.message || "Activation validée avec succès.");

      await loadActivations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow">
            Chargement des activations...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Activations
            </h1>
            <p className="mt-1 text-gray-600">
              Gérez les demandes d&apos;activation des utilisateurs.
            </p>
          </div>

          <a
            href="/admin"
            className="rounded-xl bg-gray-900 px-5 py-3 text-center font-semibold text-white hover:bg-gray-800"
          >
            ← Administration
          </a>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-2xl bg-white p-5 shadow">
          <div className="text-sm text-gray-500">
            Activations en attente
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">
            {activations.length}
          </div>
        </div>

        {activations.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow">
            <div className="text-4xl">✅</div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Aucune activation en attente
            </h2>
            <p className="mt-2 text-gray-600">
              Toutes les demandes d&apos;activation ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {activations.map((activation) => (
              <div
                key={activation.id}
                className="rounded-2xl bg-white p-6 shadow"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {activation.user.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Demande d&apos;activation
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
                      <div>
                        <span className="font-semibold">Email :</span>{" "}
                        {activation.user.email}
                      </div>

                      <div>
                        <span className="font-semibold">Téléphone :</span>{" "}
                        {activation.user.phone}
                      </div>

                      <div>
                        <span className="font-semibold">
                          Code parrainage :
                        </span>{" "}
                        {activation.user.referralCode}
                      </div>

                      <div>
                        <span className="font-semibold">Montant :</span>{" "}
                        {activation.amount.toLocaleString("fr-FR")} FCFA
                      </div>

                      <div>
                        <span className="font-semibold">
                          Statut du compte :
                        </span>{" "}
                        {activation.user.isActive
                          ? "Actif"
                          : "Inactif"}
                      </div>

                      <div>
                        <span className="font-semibold">
                          Demande :
                        </span>{" "}
                        {new Date(
                          activation.createdAt
                        ).toLocaleString("fr-FR")}
                      </div>
                    </div>

                    {activation.proof && (
                      <div className="rounded-xl bg-gray-50 p-4">
                        <div className="mb-2 text-sm font-semibold text-gray-700">
                          Preuve de paiement
                        </div>

                        <a
                          href={activation.proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Voir la preuve
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="w-full lg:w-56">
                    <button
                      type="button"
                      onClick={() =>
                        validateActivation(activation.userId)
                      }
                      disabled={processing === activation.userId}
                      className="w-full rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing === activation.userId
                        ? "Validation..."
                        : "✓ Valider l'activation"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
