"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  referralCode: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");

        const result = await response.json();

        if (!response.ok) {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
            return;
          }

          throw new Error(
            result.error || "Impossible de charger votre compte."
          );
        }

        setUser(result.user);
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

    loadProfile();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

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

      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ⚙️ Mon compte
          </h1>

          <p className="mt-2 text-gray-600">
            Consultez les informations de votre compte LegendProfit.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Chargement de votre compte...
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

        {!loading && !error && user && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 border-b pb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
                  👤
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {user.name}
                  </h2>

                  <p className="text-sm text-gray-500">
                    Membre depuis le {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nom complet
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {user.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Adresse email
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {user.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Numéro de téléphone
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {user.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                🔗 Parrainage
              </h2>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-500">
                  Votre code de parrainage
                </p>

                <div className="mt-2 rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-lg font-bold tracking-wider text-gray-900">
                    {user.referralCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                💰 Situation du compte
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Solde parrainage
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {user.balance.toLocaleString("fr-FR")} FCFA
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Ce solde contient uniquement vos commissions de
                    parrainage.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Statut du compte
                  </p>

                  {user.isActive ? (
                    <p className="mt-1 font-bold text-green-600">
                      ✓ Compte actif
                    </p>
                  ) : (
                    <p className="mt-1 font-bold text-yellow-600">
                      ⏳ En attente d'activation
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-gray-900">
                🔐 Sécurité
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                La modification du mot de passe et des informations
                personnelles pourra être ajoutée dans la prochaine
                étape.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}