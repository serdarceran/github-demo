"use client";

import { DaySummary } from "@goal-tracker/core";
import { today } from "@goal-tracker/core";

interface Props {
  dateStr: string | null;
  summary?: DaySummary;
  onClick?: () => void;
}

const cellBg: Record<string, string> = {
  "all-met":    "bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-200",
  "partial":    "bg-amber-100  hover:bg-amber-200 active:bg-amber-200",
  "all-missed": "bg-red-100    hover:bg-red-200 active:bg-red-200",
  "future":     "bg-white      hover:bg-gray-50 active:bg-gray-50",
  "no-goals":   "bg-white      hover:bg-gray-50 active:bg-gray-50",
};

const dotColor: Record<string, string> = {
  met:          "bg-emerald-500",
  missed:       "bg-red-400",
  "not-logged": "bg-red-400",
  future:       "bg-gray-300",
};

const mobileDotColor: Record<string, string> = {
  "all-met":    "bg-emerald-500",
  "partial":    "bg-amber-400",
  "all-missed": "bg-red-400",
};

export default function DayCell({ dateStr, summary, onClick }: Props) {
  if (!dateStr) {
    return <div className="t-cal-day-cell-empty h-12 sm:h-20" />;
  }

  const isToday = dateStr === today();
  const bg = summary ? cellBg[summary.overallStatus] : "bg-white hover:bg-gray-50";
  const dayNum = parseInt(dateStr.split("-")[2], 10);
  const entries = summary?.entries ?? [];
  const visibleEntries = entries.slice(0, 3);
  const overflow = entries.length - visibleEntries.length;
  const hasMobileDot =
    entries.length > 0 &&
    summary?.overallStatus !== "future" &&
    summary?.overallStatus !== "no-goals";

  return (
    <button
      onClick={onClick}
      className={`t-cal-day-cell relative w-full h-12 sm:h-20 rounded-lg sm:rounded-xl p-1.5 sm:p-2 text-left transition-colors cursor-pointer active:scale-95 ${bg} ${
        isToday ? "ring-2 ring-sky-500 ring-offset-1" : ""
      }`}
    >
      {/* Day number */}
      <span
        className={`t-cal-day-number block text-xs sm:text-sm font-semibold leading-none ${
          isToday ? "text-sky-600" : "text-gray-700"
        }`}
      >
        {dayNum}
      </span>

      {/* Per-goal dots — desktop only */}
      {visibleEntries.length > 0 && (
        <div className="t-cal-day-dot-row hidden sm:flex mt-1.5 flex-wrap gap-0.5">
          {visibleEntries.map((entry) => (
            <span
              key={entry.goal.id}
              className={`t-cal-day-goal-dot w-2 h-2 rounded-full flex-shrink-0 ${dotColor[entry.status]}`}
              title={entry.goal.name}
            />
          ))}
          {overflow > 0 && (
            <span className="t-cal-day-overflow text-gray-400 text-xs leading-none">
              +{overflow}
            </span>
          )}
        </div>
      )}

      {/* Mobile: single status dot at bottom center */}
      {hasMobileDot && (
        <span
          className={`t-cal-day-mobile-dot sm:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
            mobileDotColor[summary!.overallStatus] ?? "bg-gray-300"
          }`}
        />
      )}

      {/* met/total count — desktop only, bottom-right */}
      {entries.length > 0 &&
        summary?.overallStatus !== "future" &&
        summary?.overallStatus !== "no-goals" && (
          <span className="t-cal-day-count hidden sm:block absolute bottom-1.5 right-2 text-xs text-gray-400 leading-none">
            {entries.filter((e) => e.status === "met").length}/{entries.length}
          </span>
        )}
    </button>
  );
}
