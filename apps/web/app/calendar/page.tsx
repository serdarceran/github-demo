"use client";

import { useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import Navbar from "@/components/Navbar";
import Calendar from "@/components/Calendar";
import DayDetailModal from "@/components/DayDetailModal";
import { getDaySummary } from "@goal-tracker/core";
import { today } from "@goal-tracker/core";

export default function CalendarPage() {
  const { hydrated, activeGoals, logProgress } = useGoals();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const jumpToToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedDate(today());
  };

  if (!hydrated) {
    return (
      <div className="t-calendar-page-loading min-h-screen flex items-center justify-center">
        <div className="t-calendar-page-loading-text animate-pulse text-gray-400 text-sm">Loadingâ€¦</div>
      </div>
    );
  }

  const selectedSummary = selectedDate
    ? getDaySummary(selectedDate, activeGoals)
    : null;

  return (
    <>
      <Navbar />
      <main className="t-calendar-page-main max-w-5xl mx-auto sm:px-4 py-4 sm:py-8">
        {/* Page header */}
        <div className="t-calendar-page-header flex items-center justify-between mb-4 sm:mb-6 px-4 sm:px-0">
          <div className="t-calendar-page-header-left">
            <h1 className="t-calendar-page-title text-xl sm:text-2xl font-bold text-gray-900">Calendar</h1>
            <p className="t-calendar-page-subtitle text-gray-500 text-xs sm:text-sm mt-0.5">
              Your goal history at a glance
            </p>
          </div>
          <button
            onClick={jumpToToday}
            className="t-calendar-jump-today-btn bg-sky-50 active:bg-sky-100 hover:bg-sky-100 text-sky-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
          >
            Today
          </button>
        </div>

        <Calendar
          year={viewYear}
          month={viewMonth}
          goals={activeGoals}
          onDayClick={setSelectedDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </main>

      {selectedSummary && (
        <DayDetailModal
          summary={selectedSummary}
          onClose={() => setSelectedDate(null)}
          onLog={(goalId, value) => logProgress(goalId, value)}
        />
      )}
    </>
  );
}
