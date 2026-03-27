"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import { Difficulty, Goal } from "@/lib/types";
import {
  getMonthlyTarget,
  getWeeklyTarget,
  addDays,
  today,
  DIFFICULTY_LABELS,
  DIFFICULTY_MULTIPLIERS,
} from "@/lib/calculations";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

export default function CreateGoalPage() {
  const router = useRouter();
  const { state, addGoal } = useGoals();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [badgeName, setBadgeName] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const daily = parseInt(dailyTarget, 10) || 0;
  const weekly = daily > 0 ? getWeeklyTarget(daily, difficulty) : 0;
  const monthly = daily > 0 ? getMonthlyTarget(daily, difficulty) : 0;
  const endDate = addDays(startDate, 29);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Goal name is required.";
    if (!unit.trim()) errs.unit = "Unit is required.";
    if (!dailyTarget || daily <= 0) errs.dailyTarget = "Enter a positive daily target.";
    if (!badgeName.trim()) errs.badgeName = "Badge name is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date();
    const goal: Goal = {
      id: uuidv4(),
      name: name.trim(),
      unit: unit.trim(),
      dailyTarget: daily,
      difficulty,
      badgeName: badgeName.trim(),
      startDate,
      endDate,
      status: "active",
      logs: [],
      cumulativeTotal: 0,
      totalDebt: 0,
      nextDayMultiplier: 1,
      streak: 0,
      createdAt: now.toISOString(),
    };

    addGoal(goal);
    router.push(`/goals/${goal.id}`);
  };

  return (
    <>
      <Navbar username={state.username} />
      <main className="t-create-main max-w-2xl mx-auto px-4 py-8">
        <h1 className="t-create-title text-2xl font-bold text-gray-900 mb-6">Create a New Goal</h1>

        <form onSubmit={handleSubmit} className="t-create-form space-y-5">
          <Field label="Goal Name" error={errors.name}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read books"
              className="t-create-field-input-name input"
            />
          </Field>

          <Field label="Unit" error={errors.unit}>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. pages, minutes, km"
              className="t-create-field-input-unit input"
            />
          </Field>

          <Field label="Daily Target" error={errors.dailyTarget}>
            <input
              type="number"
              min="1"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              placeholder="e.g. 20"
              className="t-create-field-input-daily-target input"
            />
          </Field>

          {/* Difficulty selector */}
          <div className="t-create-difficulty-section">
            <label className="t-create-difficulty-label block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <div className="t-create-difficulty-grid grid grid-cols-3 gap-2">
              {difficulties.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`t-create-difficulty-btn-${d} py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    difficulty === d
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                  <span className="t-create-difficulty-multiplier block text-xs font-normal opacity-60">
                    ×{DIFFICULTY_MULTIPLIERS[d]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Badge Name (awarded on completion)" error={errors.badgeName}>
            <input
              type="text"
              value={badgeName}
              onChange={(e) => setBadgeName(e.target.value)}
              placeholder="e.g. Bookworm, Iron Runner"
              className="t-create-field-input-badge-name input"
            />
          </Field>

          <Field label="Start Date" error={errors.startDate}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="t-create-field-input-start-date input"
            />
            <p className="text-xs text-gray-400 mt-1">Goal runs 30 days: {startDate} → {endDate}</p>
          </Field>

          {/* Preview */}
          {daily > 0 && (
            <div className="t-create-preview bg-sky-50 border border-sky-200 rounded-xl p-4 text-sm space-y-1.5">
              <p className="t-create-preview-title font-semibold text-sky-800 mb-2">Calculated Targets</p>
              <Row label="Daily target" value={`${daily} ${unit || "units"}`} />
              <Row label="Weekly target" value={`${weekly} ${unit || "units"}`} />
              <Row label="Monthly target" value={`${monthly} ${unit || "units"}`} />
              <Row label="Period" value={`${startDate} → ${endDate}`} />
            </div>
          )}

          <div className="t-create-actions flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="t-create-cancel-btn flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="t-create-submit-btn flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .input:focus {
          box-shadow: 0 0 0 2px #0ea5e9;
          border-color: #0ea5e9;
        }
      `}</style>
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="t-create-field">
      <label className="t-create-field-label block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="t-create-field-error text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="t-create-preview-row flex justify-between">
      <span className="t-create-preview-row-label text-sky-700">{label}</span>
      <span className="t-create-preview-row-value font-semibold text-sky-900">{value}</span>
    </div>
  );
}
