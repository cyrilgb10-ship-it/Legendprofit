"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    referralCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");

    if (ref) {
      setForm((current) => ({
        ...current,
        referralCode: ref.toUpperCase(),
      }));
    }
  }, [searchParams]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    // Le code de parrainage ne peut pas être modifié manuellement.
    if (name === "referralCode") {
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    if (!form.referralCode) {
      setError(
        "Vous devez utiliser le lien de parrainage reçu pour créer votre compte."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Une erreur est survenue.");
        return;
      }

      localStorage.setItem(
        "legendprofit_pending_activation",
        JSON.stringify({
          name: data.user.name,
          phone: data.user.phone,
          email: data.user.email,
        })
      );

      router.push("/activation");
    } catch {
      setError(
        "Impossible de contacter le serveur. Vérifiez votre connexion."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-3xl font-black tracking-tight text-emerald-400"
          >
            Legend<span className="text-white">Profit</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold">
            Créer un compte
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Rejoignez LegendProfit et commencez à développer votre réseau.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Nom complet
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Votre nom complet"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Numéro de téléphone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ex : 90 00 00 00"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Adresse email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="vous@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Mot de passe
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 caractères"
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Code de parrainage
              </label>

              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={form.referralCode}
                readOnly
                required
                placeholder="Code récupéré depuis le lien"
                className="w-full cursor-not-allowed rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 font-semibold tracking-wider text-emerald-400 outline-none placeholder:text-gray-600"
              />

              <p className="mt-2 text-xs text-gray-500">
                Le code de parrainage est automatiquement récupéré depuis le
                lien de votre parrain et ne peut pas être modifié.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Vous avez déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Se connecter
            </Link>
          </div>
        </div>

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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#050505] px-4 py-10 text-white">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
              <p className="text-sm text-gray-400">
                Chargement...
              </p>
            </div>
          </div>
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
