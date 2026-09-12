"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  referralCode: string;
  referredById: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  referredBy: {
    id: string;
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    isActive: boolean;
  } | null;

  referrals: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    createdAt: string;
  }[];

  activation: {
    id: string;
    amount: number;
    status: "PENDING" | "ACTIVE" | "REJECTED";
    proof: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;

  transactions: {
    id: string;
    type:
      | "ACTIVATION"
      | "REFERRAL_LEVEL_1"
      | "REFERRAL_LEVEL_2"
      | "REFERRAL_LEVEL_3"
      | "TASK_REWARD"
      | "WITHDRAWAL"
      | "WITHDRAWAL_FEE";
    amount: number;
    description: string | null;
    createdAt: string;
  }[];

  withdrawals: {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    method: "TMONEY" | "FLOOZ" | "MTN_MOBILE_MONEY" | "WAVE";
    account: string;
    source: "REFERRAL" | "TASK";
    taskId: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    updatedAt: string;
  }[];

  taskBalances: {
    id: string;
    taskId: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
    task: {
      id: string;
      title: string;
      reward: number;
      isActive: boolean;
    };
  }[];

  taskSubmissions: {
    id: string;
    taskId: string;
    taskDate: string;
    proof: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reward: number;
    createdAt: string;
    updatedAt: string;
    task: {
      id: string;
      title: string;
      reward: number;
    };
  }[];
};

export default function AdminUserDetailPage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const userId = window.location.pathname.split("/").pop();

        if (!userId) {
          setError("Identifiant utilisateur manquant.");
          return;
        }

        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Impossible de charger cet utilisateur.");
          return;
        }

        setUser(data.user);
      } catch {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  }

  function transactionLabel(type: UserDetail["transactions"][number]["type"]) {
    const labels: Record<
      UserDetail["transactions"][number]["type"],
      string
    > = {
      ACTIVATION: "Activation",
      REFERRAL_LEVEL_1: "Commission niveau 1",
      REFERRAL_LEVEL_2: "Commission niveau 2",
      REFERRAL_LEVEL_3: "Commission niveau 3",
      TASK_REWARD: "Gain de tâche",
      WITHDRAWAL: "Retrait",
      WITHDRAWAL_FEE: "Frais de retrait",
    };

    return labels[type];
  }

  function methodLabel(
    method: UserDetail["withdrawals"][number]["method"]
  ) {
    const labels = {
      TMONEY: "T-Money",
      FLOOZ: "Flooz",
      MTN_MOBILE_MONEY: "MTN Mobile Money",
      WAVE: "Wave",
    };

    return labels[method];
  }

  function withdrawalSourceLabel(
    source: UserDetail["withdrawals"][number]["source"]
  ) {
    return source === "TASK" ? "Tâche" : "Parrainage";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center text-gray-400">
          Chargement du profil...
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <p className="text-red-400">
            {error || "Utilisateur introuvable."}
          </p>

          <Link
            href="/admin/users"
            className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white"
          >
            ← Retour aux utilisateurs
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {user.name}
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Fiche détaillée du membre.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Retour aux utilisateurs
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-500">
              Solde parrainage
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-400">
              {formatAmount(user.balance)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-500">
              Filleuls directs
            </p>

            <p className="mt-2 text-2xl font-black">
              {user.referrals.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-500">
              Transactions
            </p>

            <p className="mt-2 text-2xl font-black">
              {user.transactions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-500">
              Retraits
            </p>

            <p className="mt-2 text-2xl font-black">
              {user.withdrawals.length}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-bold">
              Informations du compte
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Nom</p>
                <p className="mt-1 font-semibold">{user.name}</p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="mt-1 break-all font-semibold">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Téléphone</p>
                <p className="mt-1 font-semibold">{user.phone}</p>
              </div>

              <div>
                <p className="text-gray-500">Code de parrainage</p>
                <p className="mt-1 font-semibold text-emerald-400">
                  {user.referralCode}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Rôle</p>
                <p className="mt-1 font-semibold">
                  {user.role === "ADMIN"
                    ? "Administrateur"
                    : "Membre"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Statut</p>

                <p
                  className={`mt-1 font-semibold ${
                    user.isActive
                      ? "text-emerald-400"
                      : "text-yellow-400"
                  }`}
                >
                  {user.isActive ? "Actif" : "En attente"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Inscription</p>
                <p className="mt-1 font-semibold">
                  {formatDateTime(user.createdAt)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-bold">
              Parrain direct
            </h2>

            {user.referredBy ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="font-bold">
                  {user.referredBy.name}
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  {user.referredBy.email}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {user.referredBy.phone}
                </p>

                <p className="mt-3 text-xs text-emerald-400">
                  Code : {user.referredBy.referralCode}
                </p>

                <p
                  className={`mt-2 text-xs font-semibold ${
                    user.referredBy.isActive
                      ? "text-emerald-400"
                      : "text-yellow-400"
                  }`}
                >
                  {user.referredBy.isActive
                    ? "Actif"
                    : "En attente"}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-500">
                Aucun parrain direct.
              </div>
            )}

            <h2 className="mt-8 text-xl font-bold">
              Activation
            </h2>

            {user.activation ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-400">
                    Statut
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.activation.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : user.activation.status === "REJECTED"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {user.activation.status === "ACTIVE"
                      ? "Activée"
                      : user.activation.status === "REJECTED"
                        ? "Rejetée"
                        : "En attente"}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Montant
                  </p>

                  <p className="mt-1 font-semibold">
                    {formatAmount(user.activation.amount)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-gray-500">
                Aucune demande d'activation.
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">
            Filleuls directs
          </h2>

          {user.referrals.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Aucun filleul direct.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-gray-400">
                      Nom
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Email
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Téléphone
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {user.referrals.map((referral) => (
                    <tr key={referral.id}>
                      <td className="px-4 py-3 font-semibold">
                        {referral.name}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {referral.email}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {referral.phone}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            referral.isActive
                              ? "text-emerald-400"
                              : "text-yellow-400"
                          }
                        >
                          {referral.isActive
                            ? "Actif"
                            : "En attente"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(referral.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">
            Soldes des tâches
          </h2>

          {user.taskBalances.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Aucun solde de tâche.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {user.taskBalances.map((taskBalance) => (
                <div
                  key={taskBalance.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-5"
                >
                  <h3 className="font-bold">
                    {taskBalance.task.title}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Récompense :{" "}
                    {formatAmount(taskBalance.task.reward)}
                  </p>

                  <p className="mt-4 text-xl font-black text-emerald-400">
                    {formatAmount(taskBalance.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">
            Transactions
          </h2>

          {user.transactions.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Aucune transaction.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-gray-400">
                      Type
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Description
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {user.transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 font-semibold">
                        {transactionLabel(transaction.type)}
                      </td>

                      <td
                        className={`px-4 py-3 font-semibold ${
                          transaction.amount >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {transaction.amount >= 0 ? "+" : ""}
                        {formatAmount(transaction.amount)}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {transaction.description || "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">
            Retraits
          </h2>

          {user.withdrawals.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Aucun retrait.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-gray-400">
                      Source
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Frais
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Net
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Méthode
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Compte
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {user.withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="px-4 py-3">
                        {withdrawalSourceLabel(withdrawal.source)}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {formatAmount(withdrawal.amount)}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {formatAmount(withdrawal.fee)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        {formatAmount(withdrawal.netAmount)}
                      </td>

                      <td className="px-4 py-3">
                        {methodLabel(withdrawal.method)}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {withdrawal.account}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            withdrawal.status === "APPROVED"
                              ? "text-emerald-400"
                              : withdrawal.status === "REJECTED"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {withdrawal.status === "APPROVED"
                            ? "Approuvé"
                            : withdrawal.status === "REJECTED"
                              ? "Rejeté"
                              : "En attente"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {formatDateTime(withdrawal.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-xl font-bold">
            Soumissions de tâches
          </h2>

          {user.taskSubmissions.length === 0 ? (
            <p className="mt-5 text-sm text-gray-500">
              Aucune tâche soumise.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-gray-400">
                      Tâche
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Date de la tâche
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Récompense
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-gray-400">
                      Soumise le
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {user.taskSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-4 py-3 font-semibold">
                        {submission.task.title}
                      </td>

                      <td className="px-4 py-3 text-gray-400">
                        {formatDate(submission.taskDate)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-emerald-400">
                        {formatAmount(submission.reward)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={
                            submission.status === "APPROVED"
                              ? "text-emerald-400"
                              : submission.status === "REJECTED"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {submission.status === "APPROVED"
                            ? "Approuvée"
                            : submission.status === "REJECTED"
                              ? "Rejetée"
                              : "En attente"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500">
                        {formatDateTime(submission.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
