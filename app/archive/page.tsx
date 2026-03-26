"use client";

import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import BadgeDisplay from "@/components/BadgeDisplay";
import ProgressBar from "@/components/ProgressBar";
import Link from "next/link";
import { getMonthlyTarget, progressPercent } from "@/lib/calculations";

export default function ArchivePage() {
  const { state, hydrated, completedGoals, archivedGoals } = useGoals();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const failedGoals = archivedGoals.filter((g) => g.status === "failed");

  return (
    <>
      <Navbar username={state.username} />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Badges section */}
        <section>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Badges</h1>
          <p className="text-gray-500 text-sm mb-5">
            {completedGoals.length === 0
              ? "No badges earned yet. Complete a goal to earn one!"
              : `${completedGoals.length} badge${completedGoals.length !== 1 ? "s" : ""} earned`}
          </p>
          {completedGoals.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
              🏅 Earn badges by completing your monthly goals
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map((goal) => (
                <Link key={goal.id} href={`/goals/${goal.id}`}>
                  <BadgeDisplay goal={goal} />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Completed Goals</h2>
            <div className="space-y-3">
              {completedGoals.map((goal) => (
                <ArchivedGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        )}

        {/* Failed Goals */}
        {failedGoals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Failed Goals</h2>
            <div className="space-y-3">
              {failedGoals.map((goal) => (
                <ArchivedGoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          </section>
        )}

        {archivedGoals.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
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
    <Link href={`/goals/${goal.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <span className="font-semibold text-gray-800">{goal.name}</span>
            <span className="ml-2 text-xs text-gray-400">{goal.startDate} – {goal.endDate}</span>
          </div>
          <div className="flex items-center gap-2">
            {goal.status === "completed" && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                🏅 {goal.badgeName}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
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
