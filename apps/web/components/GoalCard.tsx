"use client";

import { useState } from "react";
import Link from "next/link";
import { Goal } from "@goal-tracker/types";
import {
  getMonthlyTarget,
  progressPercent,
  expectedByToday,
  daysRemaining,
  alreadyLoggedToday,
  willFailIfMissedToday,
  today,
  DIFFICULTY_LABELS,
} from "@goal-tracker/core";
import ProgressBar from "./ProgressBar";

interface Props {
  goal: Goal;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  "at-risk": "bg-red-100 text-red-600",
  completed: "bg-sky-100 text-sky-700",
  failed: "bg-red-100 text-red-700",
};

export default function GoalCard({ goal }: Props) {
  const [collapsed, setCollapsed] = useState(true);

  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const percent = progressPercent(goal);
  const expectedPercent = Math.min(100, Math.round((expectedByToday(goal) / monthly) * 100));
  const remaining = daysRemaining(goal.endDate);
  const loggedToday = alreadyLoggedToday(goal);
  const todayLog = goal.logs.find((l) => l.date === today());
  const requiredToday = Math.min(goal.dailyTarget, expectedByToday(goal));
  const isPenaltyDay = goal.nextDayMultiplier === 2;
  const failsIfMissed = willFailIfMissedToday(goal);
  const isAtRisk = goal.status === "active" && (failsIfMissed || goal.cumulativeTotal - goal.totalDebt < 0);

  return (
    <div className={`t-goal-card bg-white rounded-xl border hover:shadow-md transition-shadow ${isAtRisk ? "border-red-400" : "border-gray-200"}`}>
      {/* Header — always visible */}
      <div className="t-goal-card-header flex items-stretch sm:pb-0">
        {/* Left: tap to open details page */}
        <Link href={`/goals/${goal.id}`} className="t-goal-card-title-link flex-1 min-w-0 p-5 sm:pb-0">
          <div className="t-goal-card-title-area">
            <h3 className="t-goal-card-title font-semibold text-gray-900 text-base leading-tight truncate">
              {goal.name}
            </h3>
            <p className="t-goal-card-subtitle text-xs text-gray-400 mt-0.5">
              {goal.unit} · {DIFFICULTY_LABELS[goal.difficulty]}
            </p>
          </div>
        </Link>
        {/* Desktop: status badge only (no collapse button) */}
        <div className="hidden sm:flex items-center pr-5">
          <span className={`t-goal-card-status text-xs px-2 py-0.5 rounded-full font-medium ${isAtRisk ? statusColors["at-risk"] : statusColors[goal.status]}`}>
            {isAtRisk ? "⚠ At Risk" : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </span>
        </div>
        {/* Mobile: entire right column is the collapse/expand button */}
        <button
          className="t-goal-card-collapse-btn sm:hidden flex items-center gap-2 px-4"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <span className={`t-goal-card-status text-xs px-2 py-0.5 rounded-full font-medium ${isAtRisk ? statusColors["at-risk"] : statusColors[goal.status]}`}>
            {isAtRisk ? "⚠ At Risk" : goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </span>
          <svg
            className={`t-goal-card-chevron w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Collapsible details */}
      <Link href={`/goals/${goal.id}`} className={`t-goal-card-details-link block px-5 pb-5 cursor-pointer ${collapsed ? "hidden sm:block" : "block"}`}>
        <div className="t-goal-card-details pt-3">
          {/* Progress bar */}
          <ProgressBar
            value={percent}
            color={percent >= 100 ? "green" : goal.status === "failed" ? "red" : "sky"}
            label="Monthly progress"
            expectedAt={goal.status === "active" ? expectedPercent : undefined}
          />

          {/* Stats row */}
          <div className="t-goal-card-stats mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="Done" value={`${goal.cumulativeTotal}`} unit={goal.unit} />
            <Stat label="Monthly" value={`${monthly}`} unit={goal.unit} />
            <Stat label="Days left" value={`${remaining}`} unit="d" />
          </div>

          {/* Today status */}
          {goal.status === "active" && (
            <div
              className={`t-goal-card-today-status mt-3 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${
                loggedToday && todayLog && todayLog.value >= todayLog.required
                  ? "bg-emerald-50 text-emerald-700"
                  : failsIfMissed || (loggedToday && todayLog && todayLog.value < todayLog.required && goal.cumulativeTotal - goal.totalDebt < 0)
                  ? "bg-red-50 text-red-700"
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
                <>⚠️ Penalty day — need {requiredToday} {goal.unit}{failsIfMissed && " · goal fails if you skip!"}</>
              ) : failsIfMissed ? (
                <>🚨 Log today or goal will fail · need {requiredToday} {goal.unit}</>
              ) : (
                <>📝 Log today · need {requiredToday} {goal.unit}</>
              )}
            </div>
          )}

          {/* Streak */}
          {goal.streak > 0 && (
            <div className="t-goal-card-streak mt-2 text-xs text-amber-600 font-medium">🔥 {goal.streak}-day streak</div>
          )}
        </div>
      </Link>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="t-goal-card-stat bg-gray-50 rounded-lg px-2 py-1.5">
      <div className="t-goal-card-stat-label text-xs text-gray-400">{label}</div>
      <div className="t-goal-card-stat-value font-semibold text-gray-800 text-sm">
        {value} <span className="t-goal-card-stat-unit font-normal text-gray-400 text-xs">{unit}</span>
      </div>
    </div>
  );
}
