import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
              LegendProfit
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Administration
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Bienvenue, {user.name}. Gérez les différentes activités de
              LegendProfit depuis cet espace.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-black/30 px-5 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            Voir le site
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/users"
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-400/40 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              👥
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Utilisateurs
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Consultez les membres inscrits, leurs soldes, leurs filleuls et
              leur activité.
            </p>

            <span className="mt-5 inline-block text-sm font-semibold text-emerald-400">
              Gérer les utilisateurs →
            </span>
          </Link>

          <Link
            href="/admin/activations"
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-400/40 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Activations
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Consultez et validez les demandes d'activation des membres.
            </p>

            <span className="mt-5 inline-block text-sm font-semibold text-emerald-400">
              Gérer les activations →
            </span>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-400/40 hover:bg-white/[0.07]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
              FCFA
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Retraits
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              Consultez les demandes de retrait et approuvez ou rejetez les
              paiements.
            </p>

            <span className="mt-5 inline-block text-sm font-semibold text-emerald-400">
              Gérer les retraits →
            </span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 opacity-70">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl">
              ⚙
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Gestion du site
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              D'autres outils d'administration seront ajoutés ici
              progressivement.
            </p>

            <span className="mt-5 inline-block text-sm font-semibold text-gray-500">
              Bientôt disponible
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-bold">
            Compte administrateur
          </h2>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">Nom</p>
              <p className="mt-1 font-semibold">
                {user.name}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Email</p>
              <p className="mt-1 break-all font-semibold">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Rôle</p>
              <p className="mt-1 font-semibold text-emerald-400">
                ADMINISTRATEUR
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
