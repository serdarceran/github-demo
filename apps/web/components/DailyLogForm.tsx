"use client";

import { useState } from "react";
import { Goal } from "@goal-tracker/types";
import { today, expectedByToday } from "@goal-tracker/core";

interface Props {
  goal: Goal;
  onLog: (value: number, date: string) => void;
}

export default function DailyLogForm({ goal, onLog }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(today());

  const todayStr = today();
  const existingLog = goal.logs.find((l) => l.date === selectedDate);
  const isToday = selectedDate === todayStr;
  const alreadyLogged = !!existingLog;
  const isPenaltyDay = !alreadyLogged && isToday && goal.nextDayMultiplier === 2;
  const requiredToday = Math.min(goal.dailyTarget, expectedByToday(goal));

  if (goal.status !== "active") {
    return (
      <div className="t-log-form-inactive bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
        This goal is no longer active.
      </div>
    );
  }

  const todayMissed = alreadyLogged && existingLog && existingLog.value < existingLog.required;
  const todayMet = alreadyLogged && existingLog && existingLog.value >= existingLog.required;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(input);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a positive number.");
      return;
    }
    setError("");
    onLog(Math.round(num), selectedDate);
    setInput("");
  };

  return (
    <div className="t-log-form-card bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="t-log-form-title font-semibold text-gray-800">Log Progress</h3>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <label htmlFor="log-date" className="text-xs text-gray-400 whitespace-nowrap">
            Date
          </label>
          <input
            id="log-date"
            type="date"
            value={selectedDate}
            min={goal.startDate}
            max={todayStr < goal.endDate ? todayStr : goal.endDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setError("");
              setInput("");
            }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Status banner for selected date */}
      {alreadyLogged && (
        <div
          className={`t-log-form-status-banner text-xs px-3 py-2 rounded-lg ${
            todayMet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {todayMet ? (
            <>
              ✅ <strong>{existingLog?.value} {goal.unit}</strong>
              {isToday ? " logged today" : ` logged on ${selectedDate}`} — target met! Add more below.
            </>
          ) : (
            <>
              ⚠️ <strong>{existingLog?.value} {goal.unit}</strong> logged
              {!isToday && ` on ${selectedDate}`} — needed <strong>{existingLog?.required}</strong> total. Add more below.
            </>
          )}
        </div>
      )}

      {!alreadyLogged && isPenaltyDay && (
        <div className="t-log-form-penalty-banner text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg">
          ⚠️ <strong>Penalty day!</strong> You missed yesterday — today requires{" "}
          <strong>{requiredToday} {goal.unit}</strong>.
        </div>
      )}

      {!alreadyLogged && !isPenaltyDay && (
        <p className="t-log-form-target text-sm text-gray-500">
          {isToday ? "Target" : `Target for ${selectedDate}`}:{" "}
          <strong>{requiredToday} {goal.unit}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit} className="t-log-form flex gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Add ${goal.unit}…`}
          className="t-log-form-input flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="t-log-form-submit bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {alreadyLogged ? "Add" : "Log"}
        </button>
      </form>
      {error && <p className="t-log-form-error text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
