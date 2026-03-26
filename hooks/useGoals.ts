"use client";

import { useState, useEffect, useCallback } from "react";
import { Goal, AppState } from "@/lib/types";
import { loadState, saveState } from "@/lib/storage";
import { applyDailyLog, addToTodayLog } from "@/lib/penalty";
import { alreadyLoggedToday, today } from "@/lib/calculations";

export function useGoals() {
  const [state, setState] = useState<AppState>({ username: "", goals: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
  }, []);

  const persistState = useCallback((next: AppState) => {
    setState(next);
    saveState(next);
  }, []);

  const setUsername = useCallback(
    (username: string) => {
      persistState({ ...state, username });
    },
    [state, persistState]
  );

  const addGoal = useCallback(
    (goal: Goal) => {
      const next: AppState = { ...state, goals: [...state.goals, goal] };
      persistState(next);
    },
    [state, persistState]
  );

  const logProgress = useCallback(
    (goalId: string, value: number) => {
      const goal = state.goals.find((g) => g.id === goalId);
      if (!goal || goal.status !== "active") return;

      const updated = alreadyLoggedToday(goal)
        ? addToTodayLog(goal, value)
        : applyDailyLog(goal, value, today());
      const goals = state.goals.map((g) => (g.id === goalId ? updated : g));
      persistState({ ...state, goals });
    },
    [state, persistState]
  );

  const deleteGoal = useCallback(
    (goalId: string) => {
      const goals = state.goals.filter((g) => g.id !== goalId);
      persistState({ ...state, goals });
    },
    [state, persistState]
  );

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
