# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint

npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:migrate    # Create and apply a new migration (dev)
npm run db:migrate:prod # Apply migrations non-interactively (production)
npm run db:studio     # Open Prisma Studio (DB browser)
npm run db:push       # Push schema without migration (prototyping)
```

No test runner is configured.

Required environment variables (see `.env.example`): `DATABASE_URL`, NextAuth secret, Resend API key.

For local development with Docker: `docker-compose up` to start the database, then `npm run db:migrate`.

## Architecture

Goal tracking app built with Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma (PostgreSQL), and NextAuth.

### Data Flow

```
PostgreSQL (Prisma)
    ↓ GET /api/goals (on mount)
useGoals hook (React state) — single source of truth
    ↓ optimistic update
Components
    ↓ mutation (addGoal / logProgress / deleteGoal)
API routes → Prisma → PostgreSQL
```

`hooks/useGoals.ts` manages all client state. It fetches goals from the server on mount (calling `applyMissedDays()` to backfill penalties), applies business logic locally for immediate UI updates, then syncs to the server. No Context or global state library.

### Authentication & Guest Mode

NextAuth with JWT strategy and `CredentialsProvider` (email + bcrypt password). Full auth flow: registration → email activation (Resend) → login → forgot/reset password → account deletion with confirmation email.

Guest mode: anonymous users get a UUID stored in `sessionStorage` (also persisted to the DB as `User.isGuest = true`). The `useGoals` hook detects whether a NextAuth session exists or falls back to the guest UUID for API calls.

### Key Domain Logic

**Penalty system** (`lib/penalty.ts`): Missing a day doubles the next day's required amount (`nextDayMultiplier = 2`). Logging enough resets the multiplier to 1. `applyMissedDays()` auto-logs 0 for any unlogged past days when the app opens, triggering penalties retroactively.

**Goal failure** (`lib/calculations.ts`): `netBalance = cumulativeTotal - totalDebt`. If this goes negative, the goal is immediately `failed`. Goals also fail at month-end if cumulative total < monthly target.

**Difficulty multipliers**: Easy 1.0×, Medium 1.15×, Hard 1.3× — applied to the base daily target to compute `getMonthlyTarget()`.

### Data Model

Database schema in `prisma/schema.prisma`:

```
User (id, email, passwordHash, emailVerified, isGuest, tokens…)
  └── Goal (id, name, unit, dailyTarget, difficulty, badgeName,
            startDate, endDate, status, cumulativeTotal,
            totalDebt, nextDayMultiplier, streak, userId)
        └── DailyLog (id, date, value, required, missed, goalId)
                     [unique constraint: goalId + date]
```

Client-side types mirror this in `lib/types.ts` (`Goal`, `DailyLog`, `AppState`).

### API Routes

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/goals` | GET, POST | Load all goals / create goal |
| `/api/goals/[id]` | PATCH, DELETE | Update goal state / delete |
| `/api/goals/[id]/logs` | POST | Upsert a daily log entry |
| `/api/auth/[...nextauth]` | — | NextAuth handler |
| `/api/auth/register` | POST | Register + send activation email |
| `/api/auth/activate` | POST | Verify activation token |
| `/api/auth/forgot-password` | POST | Send reset email |
| `/api/auth/reset-password` | POST | Apply new password |
| `/api/auth/deregister` | POST | Initiate deletion + send confirm email |
| `/api/auth/deregister/confirm` | POST | Confirm and delete account |

### Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — active goals list |
| `/goals/create` | Create a new monthly goal |
| `/goals/[id]` | Goal detail, daily log form, calendar history |
| `/archive` | Completed/failed goals and earned badges |
| `/calendar` | Full calendar view |
| `/settings` | User settings |
| `/login`, `/register` | Auth pages |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/activate` | Email activation |
| `/deregister`, `/deregister/confirm` | Account deletion |
