"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TeamMember = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
};

type TeamResponse = {
  count: number;
  members: TeamMember[];
};

export default function TeamPage() {
  const [data, setData] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        const response = await fetch("/api/team");

        const result = await response.json();

        if (!response.ok) {
          if (result.redirectTo) {
            window.location.href = result.redirectTo;
            return;
          }

          throw new Error(
            result.error || "Impossible de charger votre équipe."
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

    loadTeam();
  }, []);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
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

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            👥 Mon équipe
          </h1>

          <p className="mt-2 text-gray-600">
            Retrouvez ici les personnes que vous avez directement
            parrainées.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Chargement de votre équipe...
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
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Filleuls directs
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data.count}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-gray-500">
                  Niveau de parrainage
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  Niveau 1
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Membres directement inscrits avec votre code.
                </p>
              </div>
            </div>

            {data.members.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
                <div className="text-5xl">👥</div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">
                  Votre équipe est encore vide
                </h2>

                <p className="mx-auto mt-2 max-w-md text-gray-600">
                  Partagez votre lien de parrainage pour commencer
                  à construire votre équipe.
                </p>

                <Link
                  href="/dashboard"
                  className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-800"
                >
                  Voir mon lien de parrainage
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="border-b px-6 py-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    Mes filleuls directs
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Les membres inscrits directement avec votre code.
                  </p>
                </div>

                <div className="divide-y">
                  {data.members.map((member) => (
                    <div
                      key={member.id}
                      className="px-6 py-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
                            👤
                          </div>

                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.name}
                            </h3>

                            <p className="text-sm text-gray-600">
                              {member.phone}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Inscrit le {formatDate(member.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div>
                          {member.isActive ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                              ✓ Actif
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                              ⏳ En attente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}