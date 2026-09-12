"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

type TransactionsResponse = {
  transactions: Transaction[];
};

function formatAmount(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${amount.toLocaleString("fr-FR")} FCFA`;
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

function getTransactionLabel(type: string) {
  switch (type) {
    case "ACTIVATION":
      return "Activation du compte";

    case "REFERRAL_LEVEL_1":
      return "Commission parrainage - Niveau 1";

    case "REFERRAL_LEVEL_2":
      return "Commission parrainage - Niveau 2";

    case "REFERRAL_LEVEL_3":
      return "Commission parrainage - Niveau 3";

    case "TASK_REWARD":
      return "Gain d'une tâche";

    case "WITHDRAWAL":
      return "Retrait";

    case "WITHDRAWAL_FEE":
      return "Frais de retrait";

    default:
      return "Transaction";
  }
}

function getTransactionIcon(type: string) {
  switch (type) {
    case "ACTIVATION":
      return "🔑";

    case "REFERRAL_LEVEL_1":
    case "REFERRAL_LEVEL_2":
    case "REFERRAL_LEVEL_3":
      return "👥";

    case "TASK_REWARD":
      return "🎯";

    case "WITHDRAWAL":
      return "💸";

    case "WITHDRAWAL_FEE":
      return "💰";

    default:
      return "📊";
  }
}

export default function TransactionsPage() {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/api/transactions");

        const result = await response.json();

        if (!response.ok) {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
            return;
          }

          throw new Error(
            result.error || "Impossible de charger vos transactions."
          );
        }

        setData(result);
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

    loadTransactions();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-gray-900"
          >
            LegendProfit
          </Link>

          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Mes transactions
          </h1>

          <p className="mt-2 text-gray-600">
            Consultez l'historique de toutes vos opérations.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Chargement de vos transactions...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">{error}</p>

            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              Retour au dashboard
            </Link>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Nombre total d'opérations
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {data.transactions.length}
              </p>
            </div>

            {data.transactions.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="text-5xl">📊</div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  Aucune transaction
                </h2>

                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  Vos opérations financières apparaîtront ici dès
                  qu'une transaction sera enregistrée.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b px-6 py-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Historique
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Vos gains, retraits, frais et autres opérations.
                  </p>
                </div>

                <div className="divide-y">
                  {data.transactions.map((transaction) => {
                    const isPositive = transaction.amount > 0;

                    return (
                      <div
                        key={transaction.id}
                        className="px-6 py-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                              {getTransactionIcon(transaction.type)}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900">
                                {getTransactionLabel(transaction.type)}
                              </h3>

                              {transaction.description && (
                                <p className="mt-1 break-words text-sm text-gray-600">
                                  {transaction.description}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`shrink-0 text-right text-sm font-bold ${
                              isPositive
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatAmount(transaction.amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}