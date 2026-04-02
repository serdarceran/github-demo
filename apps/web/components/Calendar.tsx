"use client";

import { Goal } from "@goal-tracker/types";
import {
  buildCalendarGrid,
  getDaySummary,
  MONTH_NAMES,
  DAY_NAMES_SHORT,
} from "@goal-tracker/core";
import DayCell from "./DayCell";

interface Props {
  year: number;
  month: number; // 0-indexed
  goals: Goal[];
  onDayClick: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function Calendar({
  year,
  month,
  goals,
  onDayClick,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const grid = buildCalendarGrid(year, month);

  return (
    <div className="t-calendar bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
      {/* Month navigation */}
      <div className="t-calendar-nav flex items-center justify-between mb-5">
        <button
          onClick={onPrevMonth}
          className="t-calendar-prev-btn p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="t-calendar-prev-icon w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="t-calendar-month-label font-bold text-gray-900 text-lg">
          {MONTH_NAMES[month]} {year}
        </h2>

        <button
          onClick={onNextMonth}
          className="t-calendar-next-btn p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          <svg
            className="t-calendar-next-icon w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="t-calendar-weekday-headers grid grid-cols-7 mb-1">
        {DAY_NAMES_SHORT.map((name) => (
          <div
            key={name}
            className="t-calendar-weekday-header text-center text-xs font-medium text-gray-400 py-1.5"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="t-calendar-grid grid grid-cols-7 gap-1">
        {grid.map((dateStr, i) => (
          <DayCell
            key={dateStr ?? `pad-${i}`}
            dateStr={dateStr}
            summary={dateStr ? getDaySummary(dateStr, goals) : undefined}
            onClick={dateStr ? () => onDayClick(dateStr) : undefined}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="t-calendar-legend flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-gray-100">
        <LegendItem dot="bg-emerald-400" label="All met" />
        <LegendItem dot="bg-amber-400"   label="Partial" />
        <LegendItem dot="bg-red-400"     label="Missed" />
        <LegendItem dot="bg-gray-300"    label="Future / no goals" />
        <span className="t-calendar-legend-today ml-auto text-xs text-gray-400">
          <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-sky-500 mr-1 align-middle" />
          Today
        </span>
      </div>
    </div>
  );
}

function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="t-calendar-legend-item flex items-center gap-1.5">
      <span className={`t-calendar-legend-dot w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className="t-calendar-legend-label text-xs text-gray-500">{label}</span>
    </div>
  );
}
