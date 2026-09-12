"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type WithdrawalSource = "REFERRAL" | "TASK";

type WithdrawalMethod =
  | "TMONEY"
  | "FLOOZ"
  | "MTN_MOBILE_MONEY"
  | "WAVE";

type TaskInfo = {
  id: string;
  title: string;
  balance: number;
};

type DashboardData = {
  user: {
    name: string;
    balance: number;
    isActive: boolean;
  };
  tasks: TaskInfo[];
};

const MIN_WITHDRAWAL_AMOUNT = 3100;
const WITHDRAWAL_FEE = 500;

function WithdrawalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sourceParam = searchParams.get("source");
  const taskId = searchParams.get("taskId");

  const source: WithdrawalSource =
    sourceParam === "TASK" && taskId ? "TASK" : "REFERRAL";

  const [data, setData] = useState<DashboardData | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("TMONEY");
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
            return;
          }

          throw new Error(
            result.error || "Impossible de charger vos informations."
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger vos informations.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const selectedTask = useMemo(() => {
    if (source !== "TASK" || !taskId || !data) {
      return null;
    }

    return data.tasks.find((task) => task.id === taskId) || null;
  }, [data, source, taskId]);

  const availableBalance =
    source === "TASK"
      ? selectedTask?.balance || 0
      : data?.user.balance || 0;

  const numericAmount = Number(amount) || 0;

  const netAmount =
    numericAmount >= MIN_WITHDRAWAL_AMOUNT
      ? numericAmount - WITHDRAWAL_FEE
      : 0;

  const canWithdraw =
    availableBalance >= MIN_WITHDRAWAL_AMOUNT &&
    numericAmount >= MIN_WITHDRAWAL_AMOUNT &&
    numericAmount <= availableBalance &&
    !submitting;

  async function submitWithdrawal(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setError("Veuillez saisir un montant valide.");
      return;
    }

    if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      setError(
        `Le montant minimum de retrait est de ${MIN_WITHDRAWAL_AMOUNT.toLocaleString(
          "fr-FR"
        )} FCFA.`
      );
      return;
    }

    if (numericAmount > availableBalance) {
      setError("Le montant demandé dépasse votre solde disponible.");
      return;
    }

    if (availableBalance < MIN_WITHDRAWAL_AMOUNT) {
      setError(
        `Vous devez disposer d'au moins ${MIN_WITHDRAWAL_AMOUNT.toLocaleString(
          "fr-FR"
        )} FCFA sur ce solde pour effectuer un retrait.`
      );
      return;
    }

    if (!account.trim()) {
      setError("Veuillez renseigner votre numéro de paiement.");
      return;
    }

    if (source === "TASK" && !selectedTask) {
      setError("La tâche sélectionnée est introuvable.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          account: account.trim(),
          source,
          taskId: source === "TASK" ? taskId : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Impossible d'effectuer le retrait.");
        return;
      }

      setSuccess(
        result.message || "Retrait enregistré avec succès."
      );

      setAmount("");
      setAccount("");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors du retrait.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black text-emerald-400">
            LegendProfit
          </div>

          <p className="mt-2 text-gray-400">
            Chargement des informations...
          </p>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-black px-6 text-white flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-gray-950 p-8 text-center">
          <h1 className="text-xl font-bold text-red-400">
            Une erreur est survenue
          </h1>

          <p className="mt-3 text-gray-400">{error}</p>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-black"
          >
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-xl">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 text-sm text-gray-400 hover:text-white"
        >
          ← Retour au dashboard
        </button>

        <div className="rounded-3xl border border-white/10 bg-gray-950 p-6 shadow-2xl sm:p-8">
          <div className="mb-8">
            <p
              className={`text-sm font-medium ${
                source === "TASK"
                  ? "text-yellow-400"
                  : "text-emerald-400"
              }`}
            >
              {source === "TASK"
                ? "RETRAIT D'UNE TÂCHE"
                : "RETRAIT PARRAINAGE"}
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Retirer mes gains
            </h1>

            {source === "TASK" && selectedTask ? (
              <p className="mt-2 text-gray-400">
                Solde de la tâche :{" "}
                <span className="font-semibold text-yellow-400">
                  {selectedTask.title}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-gray-400">
                Retirez uniquement vos gains de parrainage.
              </p>
            )}
          </div>

          {source === "TASK" && !selectedTask ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
              <p className="text-red-400">
                La tâche sélectionnée est introuvable.
              </p>

              <button
                onClick={() => router.push("/dashboard")}
                className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-black"
              >
                Retour au dashboard
              </button>
            </div>
          ) : (
            <>
              <div
                className={`rounded-2xl border p-5 ${
                  source === "TASK"
                    ? "border-yellow-500/20 bg-yellow-500/5"
                    : "border-emerald-500/20 bg-emerald-500/5"
                }`}
              >
                <p className="text-sm text-gray-400">
                  Solde disponible
                </p>

                <p
                  className={`mt-2 text-3xl font-black ${
                    source === "TASK"
                      ? "text-yellow-400"
                      : "text-emerald-400"
                  }`}
                >
                  {availableBalance.toLocaleString("fr-FR")} FCFA
                </p>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">
                    Retrait minimum :{" "}
                    <span
                      className={
                        source === "TASK"
                          ? "text-yellow-400"
                          : "text-emerald-400"
                      }
                    >
                      {MIN_WITHDRAWAL_AMOUNT.toLocaleString("fr-FR")} FCFA
                    </span>
                  </p>

                  {availableBalance < MIN_WITHDRAWAL_AMOUNT && (
                    <p className="mt-2 text-sm text-red-400">
                      Votre solde est inférieur au minimum requis pour
                      effectuer un retrait.
                    </p>
                  )}
                </div>
              </div>

              <form
                onSubmit={submitWithdrawal}
                className="mt-7 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Montant du retrait
                  </label>

                  <input
                    type="number"
                    min={MIN_WITHDRAWAL_AMOUNT}
                    step="1"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="Ex : 3100"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-emerald-500/50"
                    disabled={submitting}
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Minimum autorisé :{" "}
                    {MIN_WITHDRAWAL_AMOUNT.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Moyen de paiement
                  </label>

                  <select
                    value={method}
                    onChange={(event) =>
                      setMethod(
                        event.target.value as WithdrawalMethod
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-emerald-500/50"
                    disabled={submitting}
                  >
                    <option value="TMONEY">T-Money</option>
                    <option value="FLOOZ">Flooz</option>
                    <option value="MTN_MOBILE_MONEY">
                      MTN Mobile Money
                    </option>
                    <option value="WAVE">Wave</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Numéro du compte
                  </label>

                  <input
                    type="text"
                    value={account}
                    onChange={(event) =>
                      setAccount(event.target.value)
                    }
                    placeholder="Ex : 90 XX XX XX"
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-emerald-500/50"
                    disabled={submitting}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Montant demandé
                    </span>

                    <span className="font-semibold">
                      {numericAmount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Frais de retrait
                    </span>

                    <span className="font-semibold text-red-400">
                      -{WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-300">
                        Vous recevrez
                      </span>

                      <span className="text-xl font-black text-emerald-400">
                        {netAmount.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-400">
                      {success}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canWithdraw}
                  className={`w-full rounded-2xl px-6 py-4 text-lg font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    source === "TASK"
                      ? "bg-yellow-400 hover:bg-yellow-300"
                      : "bg-emerald-500 hover:bg-emerald-400"
                  }`}
                >
                  {submitting
                    ? "Traitement..."
                    : "Confirmer le retrait"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4 text-center text-sm text-gray-500">
                <p>
                  Le retrait minimum est de{" "}
                  <span className="font-semibold text-white">
                    {MIN_WITHDRAWAL_AMOUNT.toLocaleString("fr-FR")} FCFA
                  </span>
                  .
                </p>

                <p className="mt-1">
                  Les frais de retrait sont de{" "}
                  {WITHDRAWAL_FEE.toLocaleString("fr-FR")} FCFA.
                </p>

                <p className="mt-1">
                  Pour un retrait de 3 100 FCFA, vous recevrez{" "}
                  <span className="font-semibold text-emerald-400">
                    2 600 FCFA
                  </span>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function WithdrawalPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-black text-emerald-400">
              LegendProfit
            </div>

            <p className="mt-2 text-gray-400">
              Chargement...
            </p>
          </div>
        </main>
      }
    >
      <WithdrawalForm />
    </Suspense>
  );
}
