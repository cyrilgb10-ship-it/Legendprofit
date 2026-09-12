"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
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
  _count: {
    referrals: number;
    withdrawals: number;
    transactions: number;
    taskSubmissions: number;
  };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users");

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Impossible de charger les utilisateurs.");
          return;
        }

        setUsers(data.users || []);
      } catch {
        setError("Impossible de contacter le serveur.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
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
              Utilisateurs
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Consultez les membres inscrits sur LegendProfit.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Retour à l'administration
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-gray-400">
            Chargement des utilisateurs...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-gray-500">Total utilisateurs</p>
                <p className="mt-2 text-2xl font-black">
                  {users.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-gray-500">Membres actifs</p>
                <p className="mt-2 text-2xl font-black text-emerald-400">
                  {users.filter((user) => user.isActive).length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-gray-500">En attente</p>
                <p className="mt-2 text-2xl font-black text-yellow-400">
                  {users.filter((user) => !user.isActive).length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm text-gray-500">Administrateurs</p>
                <p className="mt-2 text-2xl font-black">
                  {users.filter((user) => user.role === "ADMIN").length}
                </p>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center">
                <p className="text-gray-400">
                  Aucun utilisateur enregistré.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1200px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03]">
                      <tr>
                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Utilisateur
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Contact
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Statut
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Solde
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Filleuls
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Retraits
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Transactions
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Tâches
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Inscription
                        </th>

                        <th className="px-5 py-4 font-semibold text-gray-300">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/10">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="transition hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold">
                              {user.name}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              {user.role === "ADMIN"
                                ? "Administrateur"
                                : "Membre"}
                            </div>

                            <div className="mt-1 text-xs text-gray-600">
                              Code : {user.referralCode}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-gray-300">
                              {user.email}
                            </div>

                            <div className="mt-1 text-gray-500">
                              {user.phone}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {user.isActive ? (
                              <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                                En attente
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold text-emerald-400">
                            {formatAmount(user.balance)}
                          </td>

                          <td className="px-5 py-4">
                            {user._count.referrals}
                          </td>

                          <td className="px-5 py-4">
                            {user._count.withdrawals}
                          </td>

                          <td className="px-5 py-4">
                            {user._count.transactions}
                          </td>

                          <td className="px-5 py-4">
                            {user._count.taskSubmissions}
                          </td>

                          <td className="px-5 py-4 text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="inline-flex whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
                            >
                              Voir le profil →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
