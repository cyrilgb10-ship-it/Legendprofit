"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  account: string;
  source: "REFERRAL" | "TASK";
  taskId: string | null;
  taskTitle: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

function formatAmount(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodLabel(method: string) {
  switch (method) {
    case "TMONEY":
      return "T-Money";

    case "FLOOZ":
      return "Flooz";

    case "MTN_MOBILE_MONEY":
      return "MTN Mobile Money";

    case "WAVE":
      return "Wave";

    default:
      return method;
  }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadWithdrawals() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/withdrawals");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Impossible de charger les retraits."
        );
      }

      setWithdrawals(result.withdrawals || []);
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
    loadWithdrawals();
  }, []);

  async function handleAction(
    withdrawalId: string,
    action: "APPROVE" | "REJECT"
  ) {
    const withdrawal = withdrawals.find(
      (item) => item.id === withdrawalId
    );

    if (!withdrawal) {
      return;
    }

    const confirmation =
      action === "APPROVE"
        ? `Confirmer l'approbation du retrait de ${formatAmount(
            withdrawal.amount
          )} pour ${withdrawal.user.name} ?`
        : `Confirmer le rejet du retrait de ${formatAmount(
            withdrawal.amount
          )} pour ${withdrawal.user.name} ?\n\nLe montant sera automatiquement remboursé au solde de l'utilisateur.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setProcessingId(withdrawalId);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          withdrawalId,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Impossible de traiter le retrait."
        );
      }

      setSuccess(result.message);
      await loadWithdrawals();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              LegendProfit
            </h1>

            <p className="text-sm text-gray-500">
              Administration des retraits
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            ← Administration
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            💸 Retraits en attente
          </h2>

          <p className="mt-2 text-gray-600">
            Vérifiez les demandes avant de les approuver ou de les
            rejeter.
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-medium text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Chargement des retraits...
            </p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">✅</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Aucun retrait en attente
            </h3>

            <p className="mt-2 text-gray-600">
              Toutes les demandes de retrait ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {withdrawals.map((withdrawal) => {
              const processing =
                processingId === withdrawal.id;

              return (
                <div
                  key={withdrawal.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="border-b px-6 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {withdrawal.user.name}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Demande du{" "}
                          {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>

                      <span className="inline-flex w-fit rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                        ⏳ En attente
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Utilisateur
                        </p>

                        <p className="font-medium text-gray-900">
                          {withdrawal.user.name}
                        </p>

                        <p className="text-sm text-gray-600">
                          {withdrawal.user.email}
                        </p>

                        <p className="text-sm text-gray-600">
                          {withdrawal.user.phone}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Source du retrait
                        </p>

                        {withdrawal.source === "TASK" ? (
                          <div>
                            <p className="font-semibold text-gray-900">
                              🎯 Tâche
                            </p>

                            <p className="text-sm text-gray-600">
                              {withdrawal.taskTitle ||
                                "Tâche inconnue"}
                            </p>
                          </div>
                        ) : (
                          <p className="font-semibold text-gray-900">
                            👥 Parrainage
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Montant demandé
                          </span>

                          <span className="font-bold text-gray-900">
                            {formatAmount(withdrawal.amount)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Frais
                          </span>

                          <span className="text-sm text-gray-900">
                            {formatAmount(withdrawal.fee)}
                          </span>
                        </div>

                        <div className="mt-3 border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">
                              Montant net à envoyer
                            </span>

                            <span className="text-lg font-bold text-green-600">
                              {formatAmount(
                                withdrawal.netAmount
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Méthode de paiement
                        </p>

                        <p className="font-semibold text-gray-900">
                          {getMethodLabel(withdrawal.method)}
                        </p>

                        <p className="mt-1 break-all text-sm text-gray-600">
                          {withdrawal.account}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          withdrawal.id,
                          "REJECT"
                        )
                      }
                      disabled={processing}
                      className="rounded-lg border border-red-300 bg-white px-5 py-3 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing
                        ? "Traitement..."
                        : "✕ Rejeter"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          withdrawal.id,
                          "APPROVE"
                        )
                      }
                      disabled={processing}
                      className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing
                        ? "Traitement..."
                        : "✓ Approuver"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}