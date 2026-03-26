"use client";

import { useState } from "react";
import { Goal } from "@/lib/types";
import { alreadyLoggedToday, today } from "@/lib/calculations";

interface Props {
  goal: Goal;
  onLog: (value: number) => void;
}

export default function DailyLogForm({ goal, onLog }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const loggedToday = alreadyLoggedToday(goal);
  const todayLog = goal.logs.find((l) => l.date === today());
  const requiredToday = goal.dailyTarget * goal.nextDayMultiplier;
  const isPenaltyDay = goal.nextDayMultiplier === 2;

  if (goal.status !== "active") {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
        This goal is no longer active.
      </div>
    );
  }

  const todayMissed = loggedToday && todayLog && todayLog.value < todayLog.required;
  const todayMet = loggedToday && todayLog && todayLog.value >= todayLog.required;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a positive number.");
      return;
    }
    setError("");
    onLog(Math.round(num));
    setInput("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-1">Log Today&apos;s Progress</h3>

      {/* Today's status banner */}
      {loggedToday && (
        <div className={`mb-3 text-xs px-3 py-2 rounded-lg ${todayMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {todayMet
            ? <>✅ <strong>{todayLog?.value} {goal.unit}</strong> logged today — target met! Add more below.</>
            : <>⚠️ <strong>{todayLog?.value} {goal.unit}</strong> logged — need <strong>{todayLog?.required}</strong> total. Keep adding!</>
          }
        </div>
      )}

      {!loggedToday && isPenaltyDay && (
        <div className="mb-3 text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
          ⚠️ <strong>Penalty day!</strong> You missed yesterday — today requires{" "}
          <strong>{requiredToday} {goal.unit}</strong> (2× normal).
        </div>
      )}
      {!loggedToday && !isPenaltyDay && (
        <p className="text-sm text-gray-500 mb-3">
          Target: <strong>{requiredToday} {goal.unit}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add ${goal.unit}…`}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loggedToday ? "Add" : "Log"}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
