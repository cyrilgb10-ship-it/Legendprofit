import Link from "next/link";

const features = [
  {
    title: "Parrainage 3 niveaux",
    description:
      "Développez votre réseau et recevez des commissions selon les règles du programme.",
    icon: "👥",
  },
  {
    title: "Tâches quotidiennes",
    description:
      "Accédez aux tâches disponibles et recevez 100 FCFA pour chaque tâche validée.",
    icon: "✓",
  },
  {
    title: "Retraits",
    description:
      "Demandez votre retrait à partir de 3 100 FCFA avec plusieurs moyens de paiement.",
    icon: "💸",
  },
];

const commissions = [
  {
    level: "Niveau 1",
    amount: "1 500 FCFA",
    description: "Parrainage direct",
  },
  {
    level: "Niveau 2",
    amount: "700 FCFA",
    description: "Deuxième niveau",
  },
  {
    level: "Niveau 3",
    amount: "300 FCFA",
    description: "Troisième niveau",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      {/* Navigation */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black tracking-tight">
            <span className="text-emerald-400">Legend</span>
            <span className="text-white">Profit</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
            <a href="#fonctionnement" className="transition hover:text-emerald-400">
              Fonctionnement
            </a>
            <a href="#commissions" className="transition hover:text-emerald-400">
              Commissions
            </a>
            <a href="#conditions" className="transition hover:text-emerald-400">
              Conditions
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/5 sm:block"
            >
              Se connecter
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-400"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 lg:pb-32 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Plateforme LegendProfit
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              Développez votre réseau.
              <span className="block text-emerald-400">
                Accomplissez des tâches.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-400 sm:text-xl">
              LegendProfit vous permet de participer à un programme de
              parrainage à trois niveaux et d'effectuer des tâches
              quotidiennes rémunérées selon les conditions du programme.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-emerald-500 px-8 py-4 font-bold text-black shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400"
              >
                Commencer maintenant
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              Activation du compte : 4 000 FCFA
            </p>
          </div>
        </div>
      </section>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="border-y border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Comment ça fonctionne
            </p>

            <h2 className="mt-4 text-3xl font-black sm:text-4xl">
              Un système simple et structuré
            </h2>

            <p className="mt-4 text-gray-400">
              Participez au programme, accomplissez les tâches disponibles et
              développez votre réseau.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-emerald-400/30"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-400">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commissions */}
      <section id="commissions">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
                Programme de parrainage
              </p>

              <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                3 niveaux de commissions
              </h2>

              <p className="mt-5 max-w-xl leading-8 text-gray-400">
                Chaque niveau possède une commission définie. Les commissions
                sont créditées conformément aux règles du programme et aux
                conditions d'utilisation de LegendProfit.
              </p>
            </div>

            <div className="grid gap-4">
              {commissions.map((commission) => (
                <div
                  key={commission.level}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div>
                    <p className="font-bold">{commission.level}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {commission.description}
                    </p>
                  </div>

                  <p className="text-xl font-black text-emerald-400">
                    {commission.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tâches */}
      <section className="border-y border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-black">
              100
            </div>

            <h2 className="mt-6 text-3xl font-black">
              Des tâches quotidiennes rémunérées
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">
              Les utilisateurs activés peuvent accéder aux tâches proposées
              sur la plateforme. Une tâche validée rapporte actuellement
              <span className="font-bold text-white"> 100 FCFA</span>.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-block rounded-xl bg-emerald-500 px-7 py-3.5 font-bold text-black transition hover:bg-emerald-400"
            >
              Créer mon compte
            </Link>
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section id="conditions">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
              Conditions principales
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Les informations à connaître
            </h2>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold">Activation</p>
                <p className="mt-2 text-gray-400">
                  L'activation du compte est fixée à 4 000 FCFA et fait
                  l'objet d'une validation manuelle.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold">Retraits</p>
                <p className="mt-2 text-gray-400">
                  Le montant minimum pour demander un retrait est de 3 100
                  FCFA. Des frais de 500 FCFA s'appliquent à toutes les
                  transactions.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="font-bold">Moyens de retrait</p>
                <p className="mt-2 text-gray-400">
                  TMoney, Flooz, MTN Mobile Money et Wave sont prévus pour les
                  retraits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-black sm:text-5xl">
            Prêt à rejoindre LegendProfit ?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-400">
            Créez votre compte et découvrez les fonctionnalités disponibles
            sur la plateforme.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-2xl bg-emerald-500 px-8 py-4 font-bold text-black transition hover:bg-emerald-400"
          >
            Créer un compte
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} LegendProfit. Tous droits réservés.
          </p>

          <p>
            Plateforme de parrainage et de tâches rémunérées.
          </p>
        </div>
      </footer>
    </main>
  );
}