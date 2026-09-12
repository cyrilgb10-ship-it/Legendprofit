"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ActivationPage() {
  const [user, setUser] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("legendprofit_pending_activation");

    if (savedUser) {
      try {
        const data = JSON.parse(savedUser);

        setUser({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
        });
      } catch {
        localStorage.removeItem("legendprofit_pending_activation");
      }
    }
  }, []);

  function activateAccount() {
    const message = `Bonjour LegendProfit,

Je souhaite activer mon compte.

Nom complet : ${user.name}
Numéro de téléphone : ${user.phone}
Email : ${user.email}

Montant de l'activation : 4 000 FCFA

Je vais effectuer le paiement et envoyer la preuve de paiement pour validation.

Merci.`;

    const whatsappUrl = `https://wa.me/22871048123?text=${encodeURIComponent(
      message
    )}`;

    window.location.href = whatsappUrl;
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
            Activez votre compte
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Votre inscription est terminée. Une activation de 4 000 FCFA
            est nécessaire pour commencer.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.04] p-6 shadow-2xl">
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <p className="text-sm text-gray-400">
              Frais d'activation
            </p>

            <p className="mt-2 text-4xl font-black text-emerald-400">
              4 000 FCFA
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Paiement unique pour activer votre compte
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-gray-500">Nom complet</p>
              <p className="mt-1 font-medium">
                {user.name || "Votre nom"}
              </p>
            </div>

            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="mt-1 font-medium">
                {user.phone || "Votre numéro"}
              </p>
            </div>

            <div className="rounded-xl bg-black/30 p-4">
              <p className="text-xs text-gray-500">Email</p>
              <p className="mt-1 break-all font-medium">
                {user.email || "Votre email"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm font-semibold text-yellow-400">
              Comment procéder ?
            </p>

            <ol className="mt-3 space-y-2 text-sm text-gray-400">
              <li>1. Cliquez sur « Activer mon compte ».</li>
              <li>2. Vous serez redirigé vers notre WhatsApp.</li>
              <li>3. Effectuez le paiement de 4 000 FCFA.</li>
              <li>4. Envoyez la preuve de paiement.</li>
              <li>5. L'administrateur vérifie votre paiement.</li>
              <li>6. Votre compte est ensuite activé.</li>
            </ol>
          </div>

          <button
            onClick={activateAccount}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-4 font-bold text-black transition hover:bg-emerald-400"
          >
            Activer mon compte
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            L'activation est validée manuellement après vérification du
            paiement.
          </p>
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
