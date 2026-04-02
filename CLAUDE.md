# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands use pnpm and Turborepo from the repo root:

```bash
# Prerequisites: start PostgreSQL first
docker-compose up -d

# Run all apps in dev mode
pnpm dev

# Run a single app
pnpm --filter @goal-tracker/web dev
pnpm --filter @goal-tracker/mobile start

# Build / lint / type-check (all workspaces)
pnpm build
pnpm lint
pnpm type-check

# Database
pnpm db:migrate           # create + apply migration (prompts for name)
pnpm db:migrate:prod      # apply existing migrations without prompt (CI/prod)
pnpm db:generate          # regenerate Prisma client after schema changes
pnpm db:studio            # Prisma Studio GUI
```

No test runner is configured. Node ≥20 and pnpm ≥9 are required.

## Architecture

This is a **Turborepo monorepo** (pnpm workspaces) containing two apps and four shared packages.

```
apps/
  web/      Next.js 14 App Router — the primary web client + API server
  mobile/   React Native (Expo + Expo Router) — mobile client
packages/
  db/       Prisma schema, migrations, and PrismaClient singleton
  types/    Shared TypeScript interfaces (Goal, DailyLog, AppState, etc.)
  core/     Shared domain logic: penalty.ts, calculations.ts, calendarUtils.ts
  api-client/ Shared HTTP client (ApiClient class) + typed API wrappers
```

### Data Flow

```
PostgreSQL ← Prisma (packages/db)
              ↑
          Next.js API routes (apps/web/app/api/)
              ↑
    ApiClient (packages/api-client)
              ↑                      ↑
   Web: useGoals hook (React state)  Mobile: React Query + Zustand
```

### Authentication

**Web (`apps/web`)**: NextAuth v4 with credentials provider. Sessions are server-side. Guest users are supported — the web client stores a UUID in localStorage as `userId` and passes it as a query param; the API creates an `isGuest: true` User record on first goal creation.

**Mobile (`apps/mobile`)**: JWT token flow. `POST /api/auth/token` exchanges email+password for a JWT. Token is stored in `expo-secure-store`. `useAuthStore` (Zustand, `apps/mobile/stores/authStore.ts`) manages token state and exposes `useApiClient()` for authenticated requests.

### Shared Domain Logic (`packages/core`)

- **`penalty.ts`**: Missing a day doubles the next day's required amount (`nextDayMultiplier = 2`). `applyMissedDays()` is called on app open to retroactively log 0 for unlogged past days.
- **`calculations.ts`**: `netBalance = cumulativeTotal - totalDebt`. Negative balance → immediate `failed` status. Goals also fail at month-end if cumulative total < monthly target.
- **Difficulty multipliers**: Easy 1.0×, Medium 1.15×, Hard 1.3× on the base daily target.

### Data Model (Prisma — `packages/db/prisma/schema.prisma`)

Key models: `User`, `Goal`, `DailyLog`, `Role`, `UserRole`. Goal fields mirror the `Goal` type in `packages/types`. `DailyLog` has a unique constraint on `(goalId, date)`.

### Web API Routes (`apps/web/app/api/`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/goals` | Load or create goals |
| PATCH | `/api/goals/[id]` | Update goal state after logging |
| POST | `/api/goals/[id]/logs` | Upsert a daily log entry |
| DELETE | `/api/goals/[id]` | Delete goal |
| POST | `/api/auth/token` | Issue JWT for mobile clients |

### Web Pages (`apps/web/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — active goals |
| `/goals/create` | Create a monthly goal |
| `/goals/[id]` | Goal detail, daily log form, history |
| `/archive` | Completed/failed goals and badges |
| `/calendar` | Calendar view |
| `/admin` | Admin user management panel |
| `/login`, `/register`, `/activate`, etc. | Auth flows |

### Environment

Web requires `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and optionally `RESEND_API_KEY` for email. Mobile requires `EXPO_PUBLIC_API_BASE_URL` pointing at the web app's base URL.

For local dev, `DATABASE_URL="postgresql://goaltracker:goaltracker@localhost:5432/goaltracker"`.
