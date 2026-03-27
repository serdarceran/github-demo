import { Goal, DailyLog } from "./types";
import { expectedByToday, getMonthlyTarget, isMonthOver, netBalance, today } from "./calculations";

/**
 * Applies a daily log entry to a goal, enforcing the penalty system.
 *
 * Rules:
 *  - Required = min(dailyTarget, requiredDailyPace)
 *  - If logged < required → missed, debt += (required - logged), nextDayMultiplier = 2
 *  - If logged >= required → not missed, nextDayMultiplier resets to 1
 *  - After each log: if netBalance < 0 → status = "failed"
 *  - After each log: if month is over and monthly target met → status = "completed"
 *  - After each log: if month is over and monthly target NOT met → status = "failed"
 *
 * Returns the updated goal (does NOT mutate).
 */
export function applyDailyLog(goal: Goal, value: number, date: string = today()): Goal {
  const required = Math.min(goal.dailyTarget, expectedByToday(goal));
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

  return resolveStatus(updatedGoal, date);
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

  // Walk from the goal's creation date up to yesterday (today can still be logged).
  // Using createdAt prevents backfilling days before the goal existed when created mid-month.
  const createdDate = goal.createdAt.split("T")[0];
  const effectiveStart = createdDate > goal.startDate ? createdDate : goal.startDate;
  const start = new Date(effectiveStart);
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

  // Catch goals where balance went negative on a previous day but the failure
  // was deferred (grace period). Now that we're past that day, apply it.
  // Don't fail if today's log is the reason for the negative balance — that's
  // still within the 1-day grace period granted by resolveStatus.
  const hasLogToday = current.logs.some((l) => l.date === today());
  if (current.status === "active" && netBalance(current) < 0 && !hasLogToday) {
    current = { ...current, status: "failed" };
  }

  return current;
}

/**
 * Adds to an existing log entry for a given date, or creates one if none exists.
 * Recalculates missed/shortfall based on the new cumulative daily value.
 *
 * Returns the updated goal (does NOT mutate).
 */
export function addToDateLog(goal: Goal, additionalValue: number, dateStr: string): Goal {
  const existingLog = goal.logs.find((l) => l.date === dateStr);

  if (!existingLog) {
    return applyDailyLog(goal, additionalValue, dateStr);
  }

  const newValue = existingLog.value + additionalValue;
  const required = existingLog.required;
  const oldShortfall = existingLog.missed ? required - existingLog.value : 0;
  const newMissed = newValue < required;
  const newShortfall = newMissed ? required - newValue : 0;

  const updatedLog: DailyLog = { ...existingLog, value: newValue, missed: newMissed };

  const updatedGoal: Goal = {
    ...goal,
    logs: goal.logs.map((l) => (l.date === dateStr ? updatedLog : l)),
    cumulativeTotal: goal.cumulativeTotal + additionalValue,
    totalDebt: goal.totalDebt - oldShortfall + newShortfall,
    nextDayMultiplier: newMissed ? 2 : 1,
  };

  return resolveStatus(updatedGoal, dateStr);
}

/**
 * Resolves goal status based on current state.
 * Called after every log update and when loading from storage.
 */
export function resolveStatus(goal: Goal, date: string = today()): Goal {
  if (goal.status !== "active") return goal;

  // Negative net balance → fail, but grant a 1-day grace period:
  // if the balance just went negative from today's log, keep active until tomorrow.
  if (netBalance(goal) < 0 && date < today()) {
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
