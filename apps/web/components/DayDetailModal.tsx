"use client";

import { useState } from "react";
import { DaySummary, DayEntryStatus } from "@goal-tracker/core";
import { today } from "@goal-tracker/core";

interface Props {
  summary: DaySummary;
  onClose: () => void;
  onLog: (goalId: string, value: number) => void;
}

const rowBg: Record<DayEntryStatus, string> = {
  met:         "bg-emerald-50 border-emerald-200",
  missed:      "bg-red-50     border-red-200",
  "not-logged": "bg-red-50    border-red-200",
  future:      "bg-gray-50    border-gray-200",
};

const statusIcon: Record<DayEntryStatus, string> = {
  met:         "âœ…",
  missed:      "âŒ",
  "not-logged": "âŒ",
  future:      "â³",
};

export default function DayDetailModal({ summary, onClose, onLog }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const isToday = summary.date === today();

  const [y, m, d] = summary.date.split("-").map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleLog = (goalId: string) => {
    const val = parseFloat(inputs[goalId] ?? "");
    if (!isNaN(val) && val > 0) {
      onLog(goalId, Math.round(val));
      setInputs((prev) => ({ ...prev, [goalId]: "" }));
    }
  };

  return (
    <div
      className="t-day-modal-backdrop fixed inset-0 bg-gray-900/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="t-day-modal-card bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="t-day-modal-header flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="t-day-modal-header-text">
            {isToday && (
              <p className="t-day-modal-today-tag text-xs font-semibold text-sky-600 uppercase tracking-wide mb-0.5">
                Today
              </p>
            )}
            <h2 className="t-day-modal-date font-bold text-gray-900 text-lg leading-tight">
              {displayDate}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="t-day-modal-close-btn mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="t-day-modal-close-icon w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="t-day-modal-body overflow-y-auto px-5 py-4 space-y-3">
          {summary.entries.length === 0 ? (
            <p className="t-day-modal-no-goals text-sm text-gray-400 text-center py-8">
              No goals were active on this day.
            </p>
          ) : (
            summary.entries.map((entry) => (
              <div
                key={entry.goal.id}
                className={`t-day-modal-goal-row rounded-xl border p-4 ${rowBg[entry.status]}`}
              >
                {/* Goal name + status icon */}
                <div className="t-day-modal-goal-header flex items-center justify-between gap-2 mb-1">
                  <span className="t-day-modal-goal-name font-semibold text-gray-800 text-sm leading-snug">
                    {entry.goal.name}
                  </span>
                  <span className="t-day-modal-goal-status-icon text-base shrink-0">
                    {statusIcon[entry.status]}
                  </span>
                </div>

                {/* Log value */}
                {entry.log ? (
                  <p className="t-day-modal-goal-log text-xs text-gray-500">
                    <span className="t-day-modal-goal-log-value font-medium">
                      {entry.log.value}
                    </span>
                    {" / "}
                    <span className="t-day-modal-goal-log-required">
                      {entry.log.required}
                    </span>
                    {" "}{entry.goal.unit}
                    {entry.log.missed && (
                      <span className="t-day-modal-goal-missed ml-1.5 text-red-500 font-medium">
                        Â· missed
                      </span>
                    )}
                  </p>
                ) : entry.status === "future" ? (
                  <p className="t-day-modal-goal-future text-xs text-gray-400">Not yet reached</p>
                ) : (
                  <p className="t-day-modal-goal-no-log text-xs text-red-400">No entry recorded</p>
                )}

                {/* Log input â€” today + active goals only */}
                {isToday && entry.goal.status === "active" && (
                  <div className="t-day-modal-log-row mt-3 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={inputs[entry.goal.id] ?? ""}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, [entry.goal.id]: e.target.value }))
                      }
                      placeholder={`Add ${entry.goal.unit}â€¦`}
                      className="t-day-modal-log-input flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => handleLog(entry.goal.id)}
                      className="t-day-modal-log-btn bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {entry.log ? "Add" : "Log"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {summary.entries.length > 0 && summary.overallStatus !== "future" && (
          <div className="t-day-modal-footer px-5 py-3 border-t border-gray-100 shrink-0">
            <p className="t-day-modal-footer-text text-xs text-gray-400 text-center">
              {summary.entries.filter((e) => e.status === "met").length} of{" "}
              {summary.entries.length} goal{summary.entries.length !== 1 ? "s" : ""} met
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
