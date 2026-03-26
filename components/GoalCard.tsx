"use client";

import Link from "next/link";
import { Goal } from "@/lib/types";
import {
  getMonthlyTarget,
  getWeeklyTarget,
  progressPercent,
  expectedByToday,
  daysRemaining,
  alreadyLoggedToday,
  today,
  DIFFICULTY_LABELS,
} from "@/lib/calculations";
import ProgressBar from "./ProgressBar";

interface Props {
  goal: Goal;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-sky-100 text-sky-700",
  failed: "bg-red-100 text-red-700",
};

export default function GoalCard({ goal }: Props) {
  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const weekly = getWeeklyTarget(goal.dailyTarget, goal.difficulty);
  const percent = progressPercent(goal);
  const expectedPercent = Math.min(100, Math.round((expectedByToday(goal) / monthly) * 100));
  const remaining = daysRemaining(goal.endDate);
  const loggedToday = alreadyLoggedToday(goal);
  const todayLog = goal.logs.find((l) => l.date === today());
  const requiredToday = goal.dailyTarget * goal.nextDayMultiplier;
  const isPenaltyDay = goal.nextDayMultiplier === 2;

  return (
    <Link href={`/goals/${goal.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{goal.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {goal.unit} · {DIFFICULTY_LABELS[goal.difficulty]}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[goal.status]}`}>
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </span>
        </div>

        {/* Progress bar */}
        <ProgressBar
          value={percent}
          color={percent >= 100 ? "green" : goal.status === "failed" ? "red" : "sky"}
          label="Monthly progress"
          expectedAt={goal.status === "active" ? expectedPercent : undefined}
        />

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Done" value={`${goal.cumulativeTotal}`} unit={goal.unit} />
          <Stat label="Monthly" value={`${monthly}`} unit={goal.unit} />
          <Stat label="Days left" value={`${remaining}`} unit="d" />
        </div>

        {/* Today status */}
        {goal.status === "active" && (
          <div
            className={`mt-3 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${
              loggedToday && todayLog && todayLog.value >= todayLog.required
                ? "bg-emerald-50 text-emerald-700"
                : loggedToday || isPenaltyDay
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {loggedToday ? (
              todayLog && todayLog.value >= todayLog.required
                ? <>✅ {todayLog.value} {goal.unit} today — target met</>
                : <>⚠️ {todayLog?.value} {goal.unit} today · need {todayLog?.required} total</>
            ) : isPenaltyDay ? (
              <>⚠️ Penalty day — need {requiredToday} {goal.unit} (2×)</>
            ) : (
              <>📝 Log today · need {requiredToday} {goal.unit}</>
            )}
          </div>
        )}

        {/* Streak */}
        {goal.streak > 0 && (
          <div className="mt-2 text-xs text-amber-600 font-medium">🔥 {goal.streak}-day streak</div>
        )}
      </div>
    </Link>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2 py-1.5">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-semibold text-gray-800 text-sm">
        {value} <span className="font-normal text-gray-400 text-xs">{unit}</span>
      </div>
    </div>
  );
}
