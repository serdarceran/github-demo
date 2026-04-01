"use client";

import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import BadgeDisplay from "@/components/BadgeDisplay";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { getMonthlyTarget, progressPercent } from "@/lib/calculations";

export default function ArchivePage() {
  const { hydrated, completedGoals, archivedGoals } = useGoals();

  if (!hydrated) {
    return (
      <div className="t-archive-loading min-h-screen flex items-center justify-center">
        <div className="t-archive-loading-text animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const failedGoals = archivedGoals.filter((g) => g.status === "failed");

  return (
    <>
      <Navbar />
      <main className="t-archive-main max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Badges section */}
        <section className="t-archive-badges-section">
          <h1 className="t-archive-badges-title text-2xl font-bold text-gray-900 mb-1">Badges</h1>
          <p className="t-archive-badges-subtitle text-gray-500 text-sm mb-5">
            {completedGoals.length === 0
              ? "No badges earned yet. Complete a goal to earn one!"
              : `${completedGoals.length} badge${completedGoals.length !== 1 ? "s" : ""} earned`}
          </p>
          {completedGoals.length === 0 ? (
            <div className="t-archive-badges-empty text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              🏅 Earn badges by completing your monthly goals
            </div>
          ) : (
            <div className="t-archive-badges-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map((goal) => (
                <Link key={goal.id} href={`/goals/${goal.id}`} className="t-archive-badge-link">
                  <BadgeDisplay goal={goal} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <section className="t-archive-completed-section">
            <h2 className="t-archive-completed-title text-lg font-bold text-gray-900 mb-4">Completed Goals</h2>
            <div className="t-archive-completed-list space-y-3">
              {completedGoals.map((goal) => (
                <ArchivedGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        )}

        {/* Failed Goals */}
        {failedGoals.length > 0 && (
          <section className="t-archive-failed-section">
            <h2 className="t-archive-failed-title text-lg font-bold text-gray-900 mb-4">Failed Goals</h2>
            <div className="t-archive-failed-list space-y-3">
              {failedGoals.map((goal) => (
                <ArchivedGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        )}

        {archivedGoals.length === 0 && (
          <div className="t-archive-empty text-center py-16 text-gray-400 text-sm">
            No archived goals yet.
          </div>
        )}
      </main>
    </>
  );
}

function ArchivedGoalRow({ goal }: { goal: ReturnType<typeof useGoals>["archivedGoals"][number] }) {
  const monthly = getMonthlyTarget(goal.dailyTarget, goal.difficulty);
  const percent = progressPercent(goal);

  return (
    <Link href={`/goals/${goal.id}`} className="t-archive-goal-row-link block">
      <div className="t-archive-goal-row-card bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="t-archive-goal-row-header flex items-center justify-between gap-4 mb-2">
          <div className="t-archive-goal-row-title-area">
            <span className="t-archive-goal-row-name font-semibold text-gray-800">{goal.name}</span>
            <span className="t-archive-goal-row-dates ml-2 text-xs text-gray-400">{goal.startDate} – {goal.endDate}</span>
          </div>
          <div className="t-archive-goal-row-actions flex items-center gap-2">
            {goal.status === "completed" && (
              <span className="t-archive-goal-row-badge text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                🏅 {goal.badgeName}
              </span>
            )}
            <span
              className={`t-archive-goal-row-status text-xs px-2 py-0.5 rounded-full font-medium ${
                goal.status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {goal.status}
            </span>
          </div>
        </div>
        <ProgressBar
          value={percent}
          color={goal.status === "completed" ? "green" : "red"}
          size="sm"
          label={`${goal.cumulativeTotal} / ${monthly} ${goal.unit}`}
        />
      </div>
    </Link>
  );
}
