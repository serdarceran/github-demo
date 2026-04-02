import { Goal, AppState } from "./types";
import { applyMissedDays } from "./penalty";

const STORAGE_KEY = "goal_tracker_state";

export function loadState(): AppState {
  if (typeof window === "undefined") {
    return { username: "", goals: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { username: "", goals: [] };

    const state: AppState = JSON.parse(raw);

    // Re-apply missed days for active goals every time we load
    const updatedGoals = state.goals.map((g) =>
      g.status === "active" ? applyMissedDays(g) : g
    );

    return { ...state, goals: updatedGoals };
  } catch {
    return { username: "", goals: [] };
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function saveGoals(goals: Goal[], state: AppState): AppState {
  const next: AppState = { ...state, goals };
  saveState(next);
  return next;
}

export function saveUsername(username: string, state: AppState): AppState {
  const next: AppState = { ...state, username };
  saveState(next);
  return next;
}
