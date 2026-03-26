# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

This is a **fully client-side** goal tracking app built with Next.js 14 App Router, TypeScript, and Tailwind CSS. There is no backend, no API routes, and no database — all data lives in browser localStorage.

### Data Flow

```
localStorage → useGoals hook (React state) → components
user actions → useGoals callbacks → localStorage
```

`hooks/useGoals.ts` is the single source of truth. It hydrates from localStorage on mount, exposes mutations (`addGoal`, `logProgress`, `deleteGoal`, `setUsername`), and persists every change immediately. Components consume it directly — no Context or global state library.

### Key Domain Logic

**Penalty system** (`lib/penalty.ts`): Missing a day doubles the next day's required amount (`nextDayMultiplier = 2`). Logging enough resets the multiplier to 1. On app open, `applyMissedDays()` auto-logs 0 for any unlogged past days, triggering penalties retroactively.

**Goal failure** (`lib/calculations.ts`): `netBalance = cumulativeTotal - totalDebt`. If this goes negative at any point, the goal is immediately marked `failed`. Goals also fail at month-end if cumulative total < monthly target.

**Difficulty multipliers**: Easy 1.0×, Medium 1.15×, Hard 1.3× — applied to the base daily target.

### Data Model

Core types are in `lib/types.ts`. The two key interfaces:

- `Goal` — id (UUID), name, unit, dailyTarget, difficulty, status (`active|completed|failed`), logs (`DailyLog[]`), cumulativeTotal, totalDebt, nextDayMultiplier, streak
- `DailyLog` — date (YYYY-MM-DD), value, required, missed

State root is `AppState { username, goals[] }`, serialized to localStorage.

### Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — active goals list |
| `/goals/create` | Create a new monthly goal |
| `/goals/[id]` | Goal detail, daily log form, history |
| `/archive` | Completed/failed goals and earned badges |

All pages and components use `"use client"` — there are no server components with data fetching.