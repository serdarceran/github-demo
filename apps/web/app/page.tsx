"use client";

import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import GoalCard from "@/components/GoalCard";
import Link from "next/link";
import { willFailIfMissedToday, today, addDays } from "@goal-tracker/core";
import { useSession } from "next-auth/react";
import { v4 as uuidv4 } from "uuid";
import type { Difficulty, Goal } from "@goal-tracker/types";

const RANDOM_GOAL_NAMES = ["Run", "Read", "Meditate", "Push-ups", "Study", "Walk", "Cycle", "Swim"];
const RANDOM_UNITS = ["km", "pages", "minutes", "reps", "steps"];
const RANDOM_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

function generateRandomGoal(): Goal {
  const name = RANDOM_GOAL_NAMES[Math.floor(Math.random() * RANDOM_GOAL_NAMES.length)];
  const unit = RANDOM_UNITS[Math.floor(Math.random() * RANDOM_UNITS.length)];
  const difficulty = RANDOM_DIFFICULTIES[Math.floor(Math.random() * RANDOM_DIFFICULTIES.length)];
  const dailyTarget = Math.floor(Math.random() * 50) + 5;
  const startDate = today();
  return {
    id: uuidv4(),
    name,
    unit,
    dailyTarget,
    difficulty,
    badgeName: `${name} Champion`,
    startDate,
    endDate: addDays(startDate, 29),
    status: "active",
    logs: [],
    cumulativeTotal: 0,
    totalDebt: 0,
    nextDayMultiplier: 1,
    streak: 0,
    createdAt: new Date().toISOString(),
  };
}

export default function Dashboard() {
  const { state, hydrated, activeGoals, addGoal } = useGoals();
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.roles?.includes("system-admin") ?? false;

  const sortedGoals = [...activeGoals].sort((a, b) => {
    const aAtRisk = a.status === "active" && (willFailIfMissedToday(a) || a.cumulativeTotal - a.totalDebt < 0);
    const bAtRisk = b.status === "active" && (willFailIfMissedToday(b) || b.cumulativeTotal - b.totalDebt < 0);
    return (bAtRisk ? 1 : 0) - (aAtRisk ? 1 : 0);
  });

  if (status === "loading" || !hydrated) {
    return (
      <div className="t-dashboard-loading min-h-screen flex items-center justify-center">
        <div className="t-dashboard-loading-text animate-pulse text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

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
          <div className="hidden sm:flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => addGoal(generateRandomGoal())}
                className="t-dashboard-random-goal-btn bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                + Random Goal
              </button>
            )}
            <Link
              href="/goals/create"
              className="t-dashboard-new-goal-btn bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              + New Goal
            </Link>
          </div>
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
