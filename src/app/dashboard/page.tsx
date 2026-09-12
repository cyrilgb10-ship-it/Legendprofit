"use client";

import { useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  balance: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
};

type DashboardData = {
  user: {
    name: string;
    email: string;
    phone: string;
    referralCode: string;
    balance: number;
    isActive: boolean;
  };
  referrals: number;
  tasks: Task[];
  transactions: Transaction[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            result.error || "Impossible de charger le dashboard"
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger votre dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function formatFCFA(amount: number) {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
  }

  async function copyReferralLink() {
    if (!data) return;

    const link = `${window.location.origin}/register?ref=${data.user.referralCode}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Lien de parrainage copié !");
    } catch {
      alert("Impossible de copier le lien.");
    }
  }

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-emerald-400 text-2xl font-bold mb-2">
            LegendProfit
          </div>
          <p className="text-gray-400">Chargement de votre dashboard...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-gray-950 p-8 text-center">
          <h1 className="text-xl font-bold text-red-400 mb-3">
            Une erreur est survenue
          </h1>

          <p className="text-gray-400 mb-6">
            {error || "Impossible de charger vos données."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400 transition"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  const totalTaskBalance = data.tasks.reduce(
    (total, task) => total + task.balance,
    0
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-black tracking-tight">
            <span className="text-emerald-400">Legend</span>
            <span className="text-white">Profit</span>
          </a>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-400">
              Bonjour, {data.user.name}
            </span>

            <button
              onClick={logout}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:border-red-400/40 hover:text-red-400 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8">
          <p className="mb-2 text-sm font-medium text-emerald-400">
            TABLEAU DE BORD
          </p>

          <h1 className="text-3xl font-black sm:text-4xl">
            Bienvenue, {data.user.name} 👋
          </h1>

          <p className="mt-2 text-gray-400">
            Gérez vos gains de parrainage et vos gains issus des tâches.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 to-gray-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                SOLDE PARRAINAGE
              </span>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                Parrainage
              </span>
            </div>

            <div className="text-4xl font-black text-emerald-400">
              {formatFCFA(data.user.balance)}
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Ce solde contient uniquement vos commissions de parrainage.
            </p>

            <a
              href="/withdrawal"
              className="mt-5 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400 transition"
            >
              Retirer mes gains
            </a>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 to-gray-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">
                TOTAL GAINS DES TÂCHES
              </span>

              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                Tâches
              </span>
            </div>

            <div className="text-4xl font-black text-yellow-400">
              {formatFCFA(totalTaskBalance)}
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Total de vos soldes de tâches, séparé du solde de parrainage.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-gray-950 p-6">
          <h2 className="mb-5 text-xl font-bold">Mon compte</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Nom
              </p>
              <p className="mt-1 font-medium">{data.user.name}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </p>
              <p className="mt-1 break-all font-medium">{data.user.email}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Téléphone
              </p>
              <p className="mt-1 font-medium">{data.user.phone}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Membres parrainés
              </p>
              <p className="mt-1 font-medium">{data.referrals}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-500/20 bg-gray-950 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Mon parrainage</h2>

              <p className="mt-2 text-sm text-gray-400">
                Invitez de nouveaux membres et gagnez des commissions sur 3 niveaux.
              </p>

              <div className="mt-4">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  Votre code
                </span>

                <div className="mt-1 text-lg font-bold text-emerald-400">
                  {data.user.referralCode}
                </div>
              </div>
            </div>

            <button
              onClick={copyReferralLink}
              className="rounded-xl border border-emerald-500/30 px-5 py-3 font-semibold text-emerald-400 hover:bg-emerald-500/10 transition"
            >
              Copier mon lien
            </button>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-yellow-400">
                GAINS QUOTIDIENS
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Mes tâches
              </h2>
            </div>

            <span className="text-sm text-gray-500">
              {data.tasks.length} tâche(s) disponible(s)
            </span>
          </div>

          {data.tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-gray-950 p-8 text-center">
              <p className="text-gray-400">
                Aucune tâche disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {data.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-white/10 bg-gray-950 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">{task.title}</h3>

                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {task.description}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-400">
                      +{formatFCFA(task.reward)}
                    </span>
                  </div>

                  <div className="mt-6 rounded-xl border border-white/10 bg-black/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Solde de cette tâche
                    </p>

                    <p className="mt-1 text-2xl font-black text-yellow-400">
                      {formatFCFA(task.balance)}
                    </p>
                  </div>

                  <a
                    href={`/tasks/${task.id}`}
                    className="mt-5 block rounded-xl bg-white px-5 py-3 text-center font-semibold text-black hover:bg-gray-200 transition"
                  >
                    Voir la tâche
                  </a>

                  <a
                    href={`/withdrawal?source=TASK&taskId=${task.id}`}
                    className="mt-3 block rounded-xl border border-yellow-500/30 px-5 py-3 text-center font-semibold text-yellow-400 hover:bg-yellow-500/10 transition"
                  >
                    Retirer ce solde
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/team"
            className="rounded-xl border border-white/10 bg-gray-950 p-5 hover:border-emerald-500/30 transition"
          >
            <div className="text-lg font-bold">👥 Mon équipe</div>
            <p className="mt-1 text-sm text-gray-500">Voir vos filleuls</p>
          </a>

          <a
            href="/transactions"
            className="rounded-xl border border-white/10 bg-gray-950 p-5 hover:border-emerald-500/30 transition"
          >
            <div className="text-lg font-bold">📊 Transactions</div>
            <p className="mt-1 text-sm text-gray-500">Voir vos opérations</p>
          </a>

          <a
            href="/withdrawal"
            className="rounded-xl border border-white/10 bg-gray-950 p-5 hover:border-emerald-500/30 transition"
          >
            <div className="text-lg font-bold">💸 Retraits</div>
            <p className="mt-1 text-sm text-gray-500">Gérer vos retraits</p>
          </a>

          <a
            href="/profile"
            className="rounded-xl border border-white/10 bg-gray-950 p-5 hover:border-emerald-500/30 transition"
          >
            <div className="text-lg font-bold">⚙️ Profil</div>
            <p className="mt-1 text-sm text-gray-500">Modifier votre compte</p>
          </a>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-gray-950 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Dernières transactions</h2>

            <a
              href="/transactions"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Tout voir
            </a>
          </div>

          {data.transactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucune transaction pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {data.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.description || transaction.type}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="font-bold text-emerald-400">
                    +{formatFCFA(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="mt-12 border-t border-white/10 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} LegendProfit — Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}
