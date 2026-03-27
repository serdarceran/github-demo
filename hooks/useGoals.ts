"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, AppState } from "@/lib/types";
import { applyDailyLog, addToDateLog, applyMissedDays } from "@/lib/penalty";
import { today } from "@/lib/calculations";

// ── helpers ──────────────────────────────────────────────────────────────────

const USERNAME_KEY = "goal-tracker-username";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res;
}

async function loadGoalsFromServer(username: string): Promise<Goal[]> {
  const res = await apiFetch(`/api/goals?username=${encodeURIComponent(username)}`);
  return res.json();
}

async function persistGoalState(
  goalId: string,
  fields: Pick<Goal, "status" | "cumulativeTotal" | "totalDebt" | "nextDayMultiplier" | "streak">
) {
  await apiFetch(`/api/goals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}

async function persistLog(goalId: string, log: Goal["logs"][number]) {
  await apiFetch(`/api/goals/${goalId}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });
}

// ── hook ─────────────────────────────────────────────────────────────────────

export function useGoals() {
  const [state, setState] = useState<AppState>({ username: "", goals: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem(USERNAME_KEY) ?? "";
    if (!username) {
      setHydrated(true);
      return;
    }

    loadGoalsFromServer(username)
      .then(async (goals) => {
        // Apply missed-day penalties client-side (pure function — no DB access).
        const processed = goals.map(applyMissedDays);

        setState({ username, goals: processed });
        setHydrated(true);

        // Persist any status or log changes that applyMissedDays introduced.
        await Promise.all(
          processed.flatMap((updated, i) => {
            const original = goals[i];
            const ops: Promise<unknown>[] = [];

            if (
              updated.status !== original.status ||
              updated.cumulativeTotal !== original.cumulativeTotal ||
              updated.totalDebt !== original.totalDebt
            ) {
              ops.push(
                persistGoalState(updated.id, {
                  status: updated.status,
                  cumulativeTotal: updated.cumulativeTotal,
                  totalDebt: updated.totalDebt,
                  nextDayMultiplier: updated.nextDayMultiplier,
                  streak: updated.streak,
                })
              );
            }

            // Persist new missed-day logs that were auto-generated.
            const originalDates = new Set(original.logs.map((l) => l.date));
            const newLogs = updated.logs.filter((l) => !originalDates.has(l.date));
            for (const log of newLogs) {
              ops.push(persistLog(updated.id, log));
            }

            return ops;
          })
        );
      })
      .catch(() => setHydrated(true));
  }, []);

  // ── mutations ───────────────────────────────────────────────────────────────

  const setUsername = useCallback(async (username: string) => {
    localStorage.setItem(USERNAME_KEY, username);
    const goals = await loadGoalsFromServer(username);
    setState({ username, goals: goals.map(applyMissedDays) });
  }, []);

  const addGoal = useCallback(
    async (goal: Goal) => {
      const res = await apiFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: state.username, goal }),
      });
      const created: Goal = await res.json();
      setState((prev) => ({ ...prev, goals: [...prev.goals, created] }));
    },
    [state.username]
  );

  const logProgress = useCallback(
    async (goalId: string, value: number, date: string = today()) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal || goal.status !== "active") return;

      const alreadyLogged = goal.logs.some((l) => l.date === date);
      const updated = alreadyLogged
        ? addToDateLog(goal, value, date)
        : applyDailyLog(goal, value, date);

      // Optimistic UI update — don't block on the server round-trip.
      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? updated : g)),
      }));

      // Persist in parallel.
      const log = updated.logs.find((l) => l.date === date)!;
      await Promise.all([
        persistGoalState(goalId, {
          status: updated.status,
          cumulativeTotal: updated.cumulativeTotal,
          totalDebt: updated.totalDebt,
          nextDayMultiplier: updated.nextDayMultiplier,
          streak: updated.streak,
        }),
        persistLog(goalId, log),
      ]);
    },
    [state.goals]
  );

  const deleteGoal = useCallback(async (goalId: string) => {
    await apiFetch(`/api/goals/${goalId}`, { method: "DELETE" });
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  }, []);

  // ── derived state ───────────────────────────────────────────────────────────

  const activeGoals = state.goals.filter((g) => g.status === "active");
  const archivedGoals = state.goals.filter((g) => g.status !== "active");
  const completedGoals = state.goals.filter((g) => g.status === "completed");

  return {
    state,
    hydrated,
    activeGoals,
    archivedGoals,
    completedGoals,
    setUsername,
    addGoal,
    logProgress,
    deleteGoal,
  };
}
