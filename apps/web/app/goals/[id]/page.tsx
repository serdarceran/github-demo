"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";
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

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, hydrated, logProgress, deleteGoal } = useGoals();
  const [logValue, setLogValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const goal = state.goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Goal not found.</p>
        </main>
      </>
    );
  }

  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const percent = progressPercent(goal);
  const expectedPercent = Math.min(100, Math.round((expectedByToday(goal) / monthly) * 100));
  const remaining = daysRemaining(goal.endDate);
  const loggedToday = alreadyLoggedToday(goal);
  const failsIfMissed = willFailIfMissedToday(goal);
  const todayLog = goal.logs.find((l) => l.date === today());
  const netBalance = goal.cumulativeTotal - goal.totalDebt;
  const isAtRisk = goal.status === "active" && (failsIfMissed || netBalance < 0);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(logValue);
    if (!value || value <= 0) return;
    setSubmitting(true);
    await logProgress(goal.id, value);
    setLogValue("");
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${goal.name}"? This cannot be undone.`)) return;
    await deleteGoal(goal.id);
    router.push("/");
  };

  const sortedLogs = [...goal.logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {goal.unit} · {DIFFICULTY_LABELS[goal.difficulty]} · {goal.startDate} → {goal.endDate}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Progress</h2>
          <ProgressBar
            value={percent}
            color={percent >= 100 ? "green" : goal.status === "failed" ? "red" : "sky"}
            label="Monthly progress"
            expectedAt={goal.status === "active" ? expectedPercent : undefined}
          />
          <div className="grid grid-cols-4 gap-2 text-center">
            <Stat label="Done" value={`${goal.cumulativeTotal}`} unit={goal.unit} />
            <Stat label="Target" value={`${monthly}`} unit={goal.unit} />
            <Stat label="Balance" value={`${netBalance}`} unit={goal.unit} color={netBalance < 0 ? "text-red-600" : "text-emerald-600"} />
            <Stat label="Days left" value={`${remaining}`} unit="d" />
          </div>
          {goal.streak > 0 && (
            <p className="text-xs text-amber-600 font-medium">🔥 {goal.streak}-day streak</p>
          )}
          {goal.status !== "active" && (
            <div className={`text-sm font-medium px-3 py-2 rounded-lg ${goal.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {goal.status === "completed" ? "✅ Goal completed!" : "❌ Goal failed"}
              {goal.status === "completed" && goal.badgeName && ` · Badge earned: "${goal.badgeName}"`}
            </div>
          )}
        </div>

        {/* Log today */}
        {goal.status === "active" && (
          <div className={`bg-white border rounded-xl p-5 ${isAtRisk ? "border-red-300" : "border-gray-200"}`}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Log Progress</h2>
            {loggedToday && todayLog && (
              <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${
                todayLog.value >= todayLog.required
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {todayLog.value >= todayLog.required
                  ? `✅ ${todayLog.value} ${goal.unit} logged today — target met`
                  : `⚠️ ${todayLog.value} ${goal.unit} logged · need ${todayLog.required} ${goal.unit} total`}
              </div>
            )}
            {!loggedToday && failsIfMissed && (
              <div className="text-xs mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-700">
                🚨 Log today or goal will fail · need {todayLog?.required ?? goal.dailyTarget} {goal.unit}
              </div>
            )}
            <form onSubmit={handleLog} className="flex gap-2">
              <input
                type="number"
                min="0.01"
                step="any"
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                placeholder={`Amount in ${goal.unit}`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
              />
              <button
                type="submit"
                disabled={submitting || !logValue}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {loggedToday ? "Add more" : "Log"}
              </button>
            </form>
          </div>
        )}

        {/* Log history */}
        {sortedLogs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">History</h2>
            <div className="space-y-2">
              {sortedLogs.map((log) => (
                <div key={log.date} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{log.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">req {log.required}</span>
                    <span className={`font-medium ${log.missed ? "text-red-600" : "text-emerald-600"}`}>
                      {log.missed ? "✗" : "✓"} {log.value} {goal.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="pt-2 pb-6">
          <button
            onClick={handleDelete}
            className="t-goal-detail-delete-btn w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18" />
            </svg>
            Delete Goal
          </button>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2 py-1.5">
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`font-semibold text-sm ${color ?? "text-gray-800"}`}>
        {value} <span className="font-normal text-gray-400 text-xs">{unit}</span>
      </div>
    </div>
  );
}
