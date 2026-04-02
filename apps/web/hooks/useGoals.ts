"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import { Goal, AppState } from "@/lib/types";
import { applyDailyLog, addToDateLog, applyMissedDays } from "@/lib/penalty";
import { today } from "@/lib/calculations";

// ── guest identity ─────────────────────────────────────────────────────────────

const GUEST_ID_KEY = "goal-tracker-guest-id";

function getOrCreateGuestId(): string {
  let id = sessionStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function clearGuestId(): void {
  sessionStorage.removeItem(GUEST_ID_KEY);
}

export function getGuestId(): string | null {
  return sessionStorage.getItem(GUEST_ID_KEY);
}

// ── helpers ────────────────────────────────────────────────────────────────────

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`API ${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res;
}

async function loadGoalsFromServer(userId: string, isGuest: boolean): Promise<Goal[]> {
  const url = isGuest
    ? `/api/goals?userId=${encodeURIComponent(userId)}`
    : `/api/goals`;
  const res = await apiFetch(url);
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

// ── hook ───────────────────────────────────────────────────────────────────────

export function useGoals() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<AppState>({ username: "", goals: [] });
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    let effectiveUserId: string;
    let guest: boolean;
    let displayName: string;

    if (session?.user) {
      effectiveUserId = session.user.id;
      guest = false;
      displayName = session.user.email.split("@")[0];
    } else {
      effectiveUserId = getOrCreateGuestId();
      guest = true;
      displayName = "";
    }

    setUserId(effectiveUserId);
    setIsGuest(guest);

    loadGoalsFromServer(effectiveUserId, guest)
      .then(async (goals) => {
        const processed = goals.map(applyMissedDays);
        setState({ username: displayName, goals: processed });
        setHydrated(true);

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
  }, [session, status]);

  // ── mutations ─────────────────────────────────────────────────────────────────

  const addGoal = useCallback(
    async (goal: Goal) => {
      const body: Record<string, unknown> = { goal };
      if (isGuest) body.userId = userId;

      const res = await apiFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created: Goal = await res.json();
      setState((prev) => ({ ...prev, goals: [...prev.goals, created] }));
    },
    [userId, isGuest]
  );

  const logProgress = useCallback(
    async (goalId: string, value: number, date: string = today()) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal || goal.status !== "active") return;

      const alreadyLogged = goal.logs.some((l) => l.date === date);
      const updated = alreadyLogged
        ? addToDateLog(goal, value, date)
        : applyDailyLog(goal, value, date);

      setState((prev) => ({
        ...prev,
        goals: prev.goals.map((g) => (g.id === goalId ? updated : g)),
      }));

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

  // ── derived state ─────────────────────────────────────────────────────────────

  const activeGoals = state.goals.filter((g) => g.status === "active");
  const archivedGoals = state.goals.filter((g) => g.status !== "active");
  const completedGoals = state.goals.filter((g) => g.status === "completed");

  return {
    state,
    hydrated,
    activeGoals,
    archivedGoals,
    completedGoals,
    addGoal,
    logProgress,
    deleteGoal,
  };
}
