import { Goal, DailyLog } from "./types";
import { getMonthlyTarget, isMonthOver, netBalance, today } from "./calculations";

/**
 * Applies a daily log entry to a goal, enforcing the penalty system.
 *
 * Rules:
 *  - Required = dailyTarget × nextDayMultiplier
 *  - If logged < required → missed, debt += (required - logged), nextDayMultiplier = 2
 *  - If logged >= required → not missed, nextDayMultiplier resets to 1
 *  - After each log: if netBalance < 0 → status = "failed"
 *  - After each log: if month is over and monthly target met → status = "completed"
 *  - After each log: if month is over and monthly target NOT met → status = "failed"
 *
 * Returns the updated goal (does NOT mutate).
 */
export function applyDailyLog(goal: Goal, value: number, date: string = today()): Goal {
  const required = goal.dailyTarget * goal.nextDayMultiplier;
  const missed = value < required;
  const shortfall = missed ? required - value : 0;

  const newLog: DailyLog = { date, value, required, missed };

  const updatedGoal: Goal = {
    ...goal,
    logs: [...goal.logs, newLog],
    cumulativeTotal: goal.cumulativeTotal + value,
    totalDebt: goal.totalDebt + shortfall,
    nextDayMultiplier: missed ? 2 : 1,
    streak: missed ? 0 : goal.streak + 1,
  };

  return resolveStatus(updatedGoal);
}

/**
 * Checks for missed days between last log and today, applying penalty for each.
 * Call this when opening the app to account for days the user never logged.
 *
 * Returns the updated goal (does NOT mutate).
 */
export function applyMissedDays(goal: Goal): Goal {
  if (goal.status !== "active") return goal;

  const loggedDates = new Set(goal.logs.map((l) => l.date));
  let current = { ...goal };

  // Walk from startDate up to yesterday (today can still be logged)
  const start = new Date(goal.startDate);
  const yesterday = new Date(today());
  yesterday.setDate(yesterday.getDate() - 1);

  const cursor = new Date(start);

  while (cursor <= yesterday) {
    const dateStr = cursor.toISOString().split("T")[0];

    if (!loggedDates.has(dateStr) && dateStr >= goal.startDate) {
      // Auto-log 0 for the missed day
      current = applyDailyLog(current, 0, dateStr);
      if (current.status !== "active") break;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return current;
}

/**
 * Resolves goal status based on current state.
 * Called after every log update and when loading from storage.
 */
export function resolveStatus(goal: Goal): Goal {
  if (goal.status !== "active") return goal;

  // Negative net balance → immediate failure
  if (netBalance(goal) < 0) {
    return { ...goal, status: "failed" };
  }

  // Month is over → evaluate against monthly target
  if (isMonthOver(goal.endDate)) {
    const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
    const status = goal.cumulativeTotal >= monthly ? "completed" : "failed";
    return { ...goal, status };
  }

  return goal;
}
