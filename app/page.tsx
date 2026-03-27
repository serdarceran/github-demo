"use client";

import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import GoalCard from "@/components/GoalCard";
import UsernamePrompt from "@/components/UsernamePrompt";
import Link from "next/link";
import { willFailIfMissedToday } from "@/lib/calculations";

export default function Dashboard() {
  const { state, hydrated, activeGoals, setUsername } = useGoals();

  const sortedGoals = [...activeGoals].sort((a, b) => {
    const aAtRisk = a.status === "active" && (willFailIfMissedToday(a) || a.cumulativeTotal - a.totalDebt < 0);
    const bAtRisk = b.status === "active" && (willFailIfMissedToday(b) || b.cumulativeTotal - b.totalDebt < 0);
    return (bAtRisk ? 1 : 0) - (aAtRisk ? 1 : 0);
  });

  if (!hydrated) {
    return (
      <div className="t-dashboard-loading min-h-screen flex items-center justify-center">
        <div className="t-dashboard-loading-text animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <>
      {!state.username && <UsernamePrompt onSave={setUsername} />}
      <Navbar username={state.username} />

      <main className="t-dashboard-main max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="t-dashboard-header flex items-center justify-center sm:justify-between mb-6">
          <div className="t-dashboard-header-left text-center sm:text-left">
            <h1 className="t-dashboard-title text-2xl font-bold text-gray-900">
              {state.username ? `Hi, ${state.username} 👋` : "Dashboard"}
            </h1>
            <p className="t-dashboard-subtitle text-gray-500 text-sm mt-0.5">
              {activeGoals.length === 0
                ? "No active goals yet."
                : `${activeGoals.length} active goal${activeGoals.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/goals/create"
            className="t-dashboard-new-goal-btn hidden sm:block bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Goal
          </Link>
        </div>

        {/* Active Goals */}
        {activeGoals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="t-dashboard-goals-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="t-dashboard-empty text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
      <div className="t-dashboard-empty-icon text-5xl mb-4">🎯</div>
      <h2 className="t-dashboard-empty-title text-lg font-semibold text-gray-700 mb-1">No active goals</h2>
      <p className="t-dashboard-empty-text text-gray-400 text-sm mb-5">Start by creating your first goal for this month.</p>
      <Link
        href="/goals/create"
        className="t-dashboard-empty-create-btn inline-block bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        Create a Goal
      </Link>
    </div>
  );
}
