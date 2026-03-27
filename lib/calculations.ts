import { Difficulty, Goal } from "./types";

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.15,
  hard: 1.3,
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function getWeeklyTarget(dailyTarget: number, difficulty: Difficulty): number {
  return Math.round(dailyTarget * 7 * DIFFICULTY_MULTIPLIERS[difficulty]);
}

export function getMonthlyTarget(dailyTarget: number, difficulty: Difficulty): number {
  return Math.round(dailyTarget * 30 * DIFFICULTY_MULTIPLIERS[difficulty]);
}

/** Returns the first day of the current month as YYYY-MM-DD */
export function getMonthStart(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Returns the last day of the given month as YYYY-MM-DD */
export function getMonthEnd(date: Date = new Date()): string {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
}

/** Adds days to a YYYY-MM-DD date string, returns YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's date as YYYY-MM-DD */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Number of days elapsed since startDate up to (and including) today */
export function daysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date(today());
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff + 1);
}

/** Total days in the goal period */
export function totalGoalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/** Net balance = cumulativeTotal - totalDebt. Negative → auto-fail. */
export function netBalance(goal: Goal): number {
  return goal.cumulativeTotal - goal.totalDebt;
}

/** Days remaining until end of goal */
export function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date(today());
  const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/** Progress percentage toward monthly target (capped at 100) */
export function progressPercent(goal: Goal): number {
  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  return Math.min(100, Math.round((goal.cumulativeTotal / monthly) * 100));
}

/** Required daily pace from today to hit the monthly target */
export function expectedByToday(goal: Goal): number {
  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const remaining = daysRemaining(goal.endDate);
  if (remaining === 0) return 0;
  return Math.max(1, Math.ceil((monthly - goal.cumulativeTotal) / remaining));
}

/** True if the goal's month has fully passed */
export function isMonthOver(endDate: string): boolean {
  return today() > endDate;
}

/** True if today already has a log entry */
export function alreadyLoggedToday(goal: Goal): boolean {
  return goal.logs.some((log) => log.date === today());
}

/**
 * Returns true if NOT logging today (i.e. logging 0) would push
 * netBalance negative, causing the goal to fail tomorrow.
 */
export function willFailIfMissedToday(goal: Goal): boolean {
  if (goal.status !== "active" || alreadyLoggedToday(goal)) return false;
  const required =
    goal.nextDayMultiplier > 1 ? goal.dailyTarget * 2 : expectedByToday(goal);
  return goal.cumulativeTotal - (goal.totalDebt + required) < 0;
}
