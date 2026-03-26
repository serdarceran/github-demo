"use client";

import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import GoalCard from "@/components/GoalCard";
import UsernamePrompt from "@/components/UsernamePrompt";
import Link from "next/link";

export default function Dashboard() {
  const { state, hydrated, activeGoals, setUsername } = useGoals();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <>
      {!state.username && <UsernamePrompt onSave={setUsername} />}
      <Navbar username={state.username} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {state.username ? `Hi, ${state.username} 👋` : "Dashboard"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {activeGoals.length === 0
                ? "No active goals yet."
                : `${activeGoals.length} active goal${activeGoals.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/goals/create"
            className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Goal
          </Link>
        </div>

        {/* Active Goals */}
        {activeGoals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => (
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
    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
      <div className="text-5xl mb-4">🎯</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">No active goals</h2>
      <p className="text-gray-400 text-sm mb-5">Start by creating your first goal for this month.</p>
      <Link
        href="/goals/create"
        className="inline-block bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        Create a Goal
      </Link>
    </div>
  );
}
