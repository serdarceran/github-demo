import { Goal, DailyLog } from "./types";
import { today } from "./calculations";

export type DayEntryStatus = "met" | "missed" | "not-logged" | "future";
export type DayOverallStatus = "all-met" | "partial" | "all-missed" | "future" | "no-goals";

export interface DayGoalEntry {
  goal: Goal;
  log: DailyLog | null;
  status: DayEntryStatus;
}

export interface DaySummary {
  date: string;
  entries: DayGoalEntry[];
  overallStatus: DayOverallStatus;
}

/** Computes the summary for a single calendar day across all goals. */
export function getDaySummary(dateStr: string, goals: Goal[]): DaySummary {
  const todayStr = today();
  const isFuture = dateStr > todayStr;

  const relevantGoals = goals.filter(
    (g) => g.startDate <= dateStr && g.endDate >= dateStr
  );

  const entries: DayGoalEntry[] = relevantGoals.map((goal) => {
    const log = goal.logs.find((l) => l.date === dateStr) ?? null;
    let status: DayEntryStatus;
    if (isFuture) {
      status = "future";
    } else if (log && !log.missed) {
      status = "met";
    } else if (log && log.missed) {
      status = "missed";
    } else {
      status = "not-logged";
    }
    return { goal, log, status };
  });

  let overallStatus: DayOverallStatus;
  if (entries.length === 0) {
    overallStatus = "no-goals";
  } else if (isFuture) {
    overallStatus = "future";
  } else {
    const metCount = entries.filter((e) => e.status === "met").length;
    if (metCount === entries.length) overallStatus = "all-met";
    else if (metCount === 0) overallStatus = "all-missed";
    else overallStatus = "partial";
  }

  return { date: dateStr, entries, overallStatus };
}

/**
 * Builds the full grid of date strings (or null for padding cells)
 * for a given year/month. Always returns a multiple of 7 cells.
 */
export function buildCalendarGrid(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
