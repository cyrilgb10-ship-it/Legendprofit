"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TaskData = {
  id: string;
  title: string;
  description: string;
  reward: number;
  balance: number;
  availableToday: boolean;
  completedToday: boolean;
};

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();

  const taskId = params.id as string;

  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTask() {
      try {
        const response = await fetch(`/api/tasks/${taskId}`);

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Impossible de charger la tâche.");
          return;
        }

        setTask(data.task);
      } catch {
        setError("Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }

    loadTask();
  }, [taskId]);

  useEffect(() => {
    if (!running) {
      return;
    }

    if (countdown <= 0) {
      completeTask();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [running, countdown]);

  async function completeTask() {
    setRunning(false);
    setStarting(true);
    setError("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de valider la tâche.");
        return;
      }

      setMessage(data.message);

      setTask((current) =>
        current
          ? {
              ...current,
              balance: data.taskBalance,
              completedToday: true,
            }
          : current
      );
    } catch {
      setError("Une erreur est survenue lors de la validation.");
    } finally {
      setStarting(false);
    }
  }

  function startTask() {
    if (!task || task.completedToday || !task.availableToday) {
      return;
    }

    setMessage("");
    setError("");
    setCountdown(20);
    setRunning(true);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Chargement de la tâche...</p>
      </main>
    );
  }

  if (error && !task) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-5 rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!task) {
    return null;
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

        <div className="rounded-3xl border border-emerald-500/20 bg-zinc-950 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-400">TÂCHE DU JOUR</p>
              <h1 className="mt-2 text-3xl font-bold">{task.title}</h1>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center">
              <p className="text-xs text-gray-400">Récompense</p>
              <p className="text-xl font-bold text-yellow-400">
                +{task.reward} FCFA
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-gray-300">{task.description}</p>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center">
            <p className="text-sm text-gray-400">Solde de cette tâche</p>
            <p className="mt-2 text-3xl font-bold text-emerald-400">
              {task.balance.toLocaleString("fr-FR")} FCFA
            </p>
          </div>

          {!task.availableToday && (
            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
              <p className="font-semibold text-yellow-400">
                Cette tâche n'est pas disponible aujourd'hui.
              </p>
            </div>
          )}

          {task.completedToday && (
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="font-semibold text-emerald-400">
                ✓ Vous avez déjà effectué cette tâche aujourd'hui.
              </p>
            </div>
          )}

          {running && (
            <div className="mt-6 rounded-3xl border border-emerald-500/30 bg-zinc-900 p-8 text-center">
              <p className="text-sm text-gray-400">
                Tâche en cours...
              </p>

              <p className="my-5 text-7xl font-bold text-emerald-400">
                {countdown}
              </p>

              <p className="text-gray-400">
                Ne quittez pas cette page.
              </p>
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <p className="font-semibold text-emerald-400">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!running && !task.completedToday && task.availableToday && (
            <button
              onClick={startTask}
              disabled={starting}
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Commencer la tâche
            </button>
          )}

          <div className="mt-6 rounded-2xl bg-zinc-900 p-4 text-center text-sm text-gray-400">
            Une seule récompense est disponible par tâche et par jour.
          </div>
        </div>
      </div>
    </main>
  );
}