"use client";

import { useParams, useRouter } from "next/navigation";
import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import DailyLogForm from "@/components/DailyLogForm";
import ProgressBar from "@/components/ProgressBar";
import BadgeDisplay from "@/components/BadgeDisplay";
import {
  getMonthlyTarget,
  getWeeklyTarget,
  progressPercent,
  daysRemaining,
  daysElapsed,
  totalGoalDays,
  netBalance,
  expectedByToday,
  DIFFICULTY_LABELS,
} from "@/lib/calculations";

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, hydrated, logProgress, deleteGoal } = useGoals();

  if (!hydrated) {
    return (
      <div className="t-detail-loading min-h-screen flex items-center justify-center">
        <div className="t-detail-loading-text animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const goal = state.goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <>
        <Navbar username={state.username} />
        <main className="t-detail-not-found-main max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="t-detail-not-found-text text-gray-400">Goal not found.</p>
          <button onClick={() => router.push("/")} className="t-detail-not-found-back mt-4 text-sky-600 text-sm underline">
            Back to dashboard
          </button>
        </main>
      </>
    );
  }

  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const weekly = getWeeklyTarget(goal.dailyTarget, goal.difficulty);
  const percent = progressPercent(goal);
  const remaining = daysRemaining(goal.endDate);
  const elapsed = daysElapsed(goal.startDate);
  const totalDays = totalGoalDays(goal.startDate, goal.endDate);
  const net = netBalance(goal);
  const expected = expectedByToday(goal);
  const weeklyPercent = Math.min(100, Math.round((goal.cumulativeTotal / weekly) * 100));

  const handleDelete = () => {
    if (confirm("Delete this goal? This cannot be undone.")) {
      deleteGoal(goal.id);
      router.push("/");
    }
  };

  return (
    <>
      <Navbar username={state.username} />
      <main className="t-detail-main max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push("/")}
          className="t-detail-back-btn inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-sky-600 transition-colors group"
        >
          <svg
            className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title & status */}
        <div className="t-detail-header flex items-start justify-between gap-4">
          <div className="t-detail-header-left">
            <h1 className="t-detail-title text-2xl font-bold text-gray-900">{goal.name}</h1>
            <p className="t-detail-meta text-sm text-gray-400 mt-0.5">
              {goal.unit} · {DIFFICULTY_LABELS[goal.difficulty]} · {goal.startDate} – {goal.endDate}
            </p>
          </div>
          <StatusBadge status={goal.status} />
        </div>

        {/* Badge (if completed) */}
        {goal.status === "completed" && <BadgeDisplay goal={goal} />}

        {/* Failed notice */}
        {goal.status === "failed" && (
          <div className="t-detail-failed-notice bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            ❌ This goal was marked as <strong>failed</strong>.{" "}
            {net < 0
              ? "Your cumulative debt exceeded your progress."
              : "The monthly target was not reached by the end of the month."}
          </div>
        )}

        {/* Log form */}
        <DailyLogForm goal={goal} onLog={(v) => logProgress(goal.id, v)} />

        {/* Progress cards */}
        <div className="t-detail-progress-card bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="t-detail-progress-title font-semibold text-gray-800">Progress Overview</h2>

          <ProgressBar
            value={percent}
            label="Monthly progress"
            color={percent >= 100 ? "green" : "sky"}
            expectedAt={goal.status === "active" ? Math.min(100, Math.round((expected / monthly) * 100)) : undefined}
          />
          <ProgressBar value={weeklyPercent} label="vs Weekly target" color="amber" />

          <div className="t-detail-stats-grid grid grid-cols-2 gap-3 mt-2">
            <StatBox label="Logged" value={goal.cumulativeTotal} unit={goal.unit} />
            <StatBox label="Monthly target" value={monthly} unit={goal.unit} />
            <StatBox label="Days elapsed" value={elapsed} unit={`/ ${totalDays}`} />
            <StatBox label="Days remaining" value={remaining} unit="days" />
            <StatBox
              label="Required daily pace"
              value={expected}
              unit={goal.unit}
              highlight={goal.cumulativeTotal < expected}
            />
            <StatBox label="Net balance" value={net} unit={goal.unit} highlight={net < 0} />
          </div>

          {goal.streak > 0 && (
            <div className="t-detail-streak text-sm text-amber-600 font-medium mt-1">🔥 {goal.streak}-day streak</div>
          )}
        </div>

        {/* Daily log history */}
        {goal.logs.length > 0 && (
          <div className="t-detail-history-card bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="t-detail-history-title font-semibold text-gray-800 mb-4">Log History</h2>
            <div className="t-detail-history-list space-y-2 max-h-72 overflow-y-auto pr-1">
              {[...goal.logs].reverse().map((log) => (
                <div
                  key={log.date}
                  className={`t-detail-history-entry flex items-center justify-between text-sm px-3 py-2 rounded-lg ${
                    log.missed ? "bg-red-50" : "bg-emerald-50"
                  }`}
                >
                  <span className="t-detail-history-date text-gray-600">{log.date}</span>
                  <span className={`t-detail-history-value font-medium ${log.missed ? "text-red-600" : "text-emerald-700"}`}>
                    {log.missed ? "⚠️" : "✅"} {log.value} / {log.required} {goal.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className="t-detail-delete-section pt-2">
          <button
            onClick={handleDelete}
            className="t-detail-delete-btn text-sm text-red-400 hover:text-red-600 underline"
          >
            Delete this goal
          </button>
        </div>
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-sky-100 text-sky-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`t-detail-status-badge text-xs px-2.5 py-1 rounded-full font-semibold ${map[status] ?? ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatBox({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={`t-detail-stat-box rounded-lg px-3 py-2.5 ${highlight ? "bg-red-50" : "bg-gray-50"}`}>
      <div className="t-detail-stat-box-label text-xs text-gray-400">{label}</div>
      <div className={`t-detail-stat-box-value font-semibold text-sm ${highlight ? "text-red-600" : "text-gray-800"}`}>
        {value} <span className="t-detail-stat-box-unit font-normal text-gray-400 text-xs">{unit}</span>
      </div>
    </div>
  );
}
