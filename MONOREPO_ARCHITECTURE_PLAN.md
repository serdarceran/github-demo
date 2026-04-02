# Monorepo Architecture Plan: GoalTrack

## Answers to Design Questions

### 1. Monorepo Tool → Turborepo

Plain workspaces give you zero build caching or parallelism. Nx is overkill at this scale. Turborepo is the de facto standard for Next.js + React Native monorepos — incremental build caching, dependency-aware task scheduling, simple `turbo.json` config.

### 2. Package Manager → pnpm

Switch from npm. Reasons:
- `workspace:*` protocol is cleaner than npm equivalents
- Avoids known npm hoisting bugs with Prisma's generated client
- 30–50% smaller `node_modules` on disk
- Migration: `pnpm import` reads `package-lock.json` and regenerates as `pnpm-lock.yaml`

### 3. React Native → Expo bare workflow, iOS + Android only (not Web)

- Bare workflow gives real `ios/` and `android/` directories while keeping the Expo SDK
- Skip Expo for Web — you already have a web app in Next.js. Two competing web bundles serve no one
- `create-expo-app --template bare-minimum` inside `apps/mobile/`

### 4. Shared Code Strategy

| Package | Contents | Why shared |
|---|---|---|
| `packages/types` | `lib/types.ts`, `lib/roles.ts` — zero runtime | Both apps need the same domain models |
| `packages/core` | `lib/calculations.ts`, `lib/penalty.ts`, `lib/calendarUtils.ts` | Pure logic, zero platform deps — already only use `Date`/`Math`/`Array` |
| `packages/api-client` | Typed REST wrappers over `fetch` | Mobile calls the same API as the web app |
| `packages/db` | Prisma schema, `lib/db.ts`, `lib/tokens.ts` | Node.js only — only `apps/web` imports this |

**Stays in `apps/web` only:** `lib/auth.ts`, `lib/authz.ts`, `lib/email.ts`, `lib/syncAdmins.ts`, all `components/`, `hooks/useGoals.ts`

### 5. API Protocol → Keep REST, skip tRPC for now

The API surface is small (~8 routes). You already get end-to-end type safety via `packages/types` + `packages/api-client`. tRPC would require refactoring all API routes and `authOptions`. The `packages/api-client` abstraction makes a later tRPC migration easy.

**One required change:** API routes currently use `getServerSession()` (cookie-based). Mobile sends `Authorization: Bearer <token>`. Each route needs a thin fallback: check `Authorization` header first, fall back to cookie session.

### 6. Authentication for Mobile → JWT Bearer tokens, no new auth library

1. Add `POST /api/auth/token` endpoint: same credential check as `CredentialsProvider`, returns a signed JWT (signed with the existing `NEXTAUTH_SECRET` via `jose`)
2. Create `lib/mobileAuth.ts`: verifies a Bearer token, returns `{ userId, roles }` — same shape as `requireAuth()`
3. Update ~5 protected API routes to accept either Bearer or cookie session (additive, web app unchanged)
4. Mobile stores the JWT in **Expo SecureStore** (not AsyncStorage), 7-day TTL

### 7. State Management → TanStack Query v5 + Zustand

- `@tanstack/react-query` handles server state (fetching, caching, mutations) — works identically in React and React Native
- `zustand` handles auth token state on mobile (JWT, isGuest flag) — 1kb, has a SecureStore persist adapter
- The current `hooks/useGoals.ts` is a hand-rolled React Query implementation; migrating it removes ~80 lines of imperative state

### 8. Directory Structure

```
goal-tracker/                          # monorepo root
├── pnpm-workspace.yaml
├── package.json                       # scripts only, no prod deps
├── turbo.json
├── tsconfig.base.json
├── .env.example
├── docker-compose.yml                 # stays at root (infrastructure)
│
├── apps/
│   ├── web/                           # existing Next.js 14 app (moved here)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   ├── goals/
│   │   │   │   └── admin/
│   │   │   ├── goals/
│   │   │   ├── admin/
│   │   │   ├── calendar/
│   │   │   ├── archive/
│   │   │   └── settings/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── auth.ts               # next-auth config (stays here)
│   │   │   ├── authz.ts
│   │   │   ├── email.ts
│   │   │   └── syncAdmins.ts
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── mobile/                        # new Expo bare app
│       ├── app/                       # Expo Router v3 file-based routing
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   ├── (tabs)/
│       │   │   ├── index.tsx          # Dashboard
│       │   │   ├── calendar.tsx
│       │   │   └── archive.tsx
│       │   └── goals/
│       │       ├── create.tsx
│       │       └── [id].tsx
│       ├── components/
│       ├── hooks/
│       │   └── useGoals.ts            # React Query version (no next-auth)
│       ├── lib/
│       │   └── auth.ts                # JWT via SecureStore
│       ├── metro.config.js            # pnpm monorepo symlink fix
│       └── package.json
│
└── packages/
    ├── types/                         # @goal-tracker/types
    ├── core/                          # @goal-tracker/core
    ├── api-client/                    # @goal-tracker/api-client
    └── db/                            # @goal-tracker/db (Node.js only)
```

### 9. Environment Variables

**Principle: each app owns its own `.env` files; shared packages never read `process.env`.**

```
apps/web/.env.local        → DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, RESEND_API_KEY, FROM_EMAIL, SYSTEM_ADMIN_EMAILS
apps/mobile/.env           → EXPO_PUBLIC_API_BASE_URL (the deployed web URL, only var mobile needs)
.env.example (root)        → documents everything
```

Mobile env vars must be prefixed `EXPO_PUBLIC_` to be bundled. Auth credentials never go in env vars on mobile — they flow through login → SecureStore.

### 10. Turborepo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json", "package.json"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"], "outputs": [] },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false }
  }
}
```

`"dependsOn": ["^build"]` means `apps/web` waits for all `packages/*` to build first. Run `turbo dev --filter=web` for web only, `turbo dev` for both.

---

## Key Config File Snippets

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json`

```json
{
  "name": "goal-tracker-monorepo",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=@goal-tracker/web",
    "dev:mobile": "turbo dev --filter=@goal-tracker/mobile",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:generate": "turbo db:generate --filter=@goal-tracker/db",
    "db:migrate": "turbo db:migrate --filter=@goal-tracker/db",
    "db:studio": "pnpm --filter=@goal-tracker/db db:studio"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "typescript": "^5.7.0"
  }
}
```

### `tsconfig.base.json` (root)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "ES2020",
    "lib": ["ES2020"]
  }
}
```

### `packages/types/package.json`

```json
{
  "name": "@goal-tracker/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "devDependencies": { "typescript": "^5.7.0" }
}
```

### `packages/core/package.json`

```json
{
  "name": "@goal-tracker/core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "@goal-tracker/types": "workspace:*" },
  "devDependencies": { "typescript": "^5.7.0" }
}
```

### `packages/api-client/package.json`

```json
{
  "name": "@goal-tracker/api-client",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "@goal-tracker/types": "workspace:*" },
  "devDependencies": { "typescript": "^5.7.0" }
}
```

### `packages/db/package.json`

```json
{
  "name": "@goal-tracker/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "prisma": { "seed": "npx tsx prisma/seed.ts" },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@prisma/client": "^5.22.0" },
  "devDependencies": {
    "prisma": "^5.22.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0"
  }
}
```

### `apps/web/package.json` (abbreviated)

```json
{
  "name": "@goal-tracker/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@goal-tracker/core": "workspace:*",
    "@goal-tracker/types": "workspace:*",
    "@goal-tracker/db": "workspace:*",
    "@goal-tracker/api-client": "workspace:*",
    "@tanstack/react-query": "^5.70.0",
    "bcryptjs": "^3.0.3",
    "next": "14.2.3",
    "next-auth": "^4.24.13",
    "react": "^18",
    "react-dom": "^18",
    "resend": "^6.10.0",
    "uuid": "^9.0.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/uuid": "^9.0.8",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.3",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.7.0"
  }
}
```

### `apps/mobile/metro.config.js` (critical — without this Metro can't resolve `@goal-tracker/*`)

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
```

---

## Migration Phases

### Phase 0 — Bootstrap (1–2 hrs)

1. Create `apps/` and `packages/` directories at the repo root
2. `pnpm import` to convert `package-lock.json` → `pnpm-lock.yaml`, then delete `package-lock.json` and `node_modules/`
3. Create `pnpm-workspace.yaml` (see snippet above)
4. Create root `package.json` with workspace scripts only (see snippet above)
5. Create `tsconfig.base.json` at root (see snippet above)
6. `pnpm add -Dw turbo` and create `turbo.json`

### Phase 1 — Scaffold Shared Packages (2–3 hrs)

Move files in dependency order (types first, then dependents):

**Step 1: `packages/types`**
- Copy `lib/types.ts` → `packages/types/src/goal.ts`
- Copy `lib/roles.ts` → `packages/types/src/roles.ts`
- Create `packages/types/src/index.ts` re-exporting both
- Create `packages/types/package.json` and `tsconfig.json`

**Step 2: `packages/core`**
- Copy `lib/calculations.ts` → `packages/core/src/calculations.ts`
- Copy `lib/penalty.ts` → `packages/core/src/penalty.ts`
- Copy `lib/calendarUtils.ts` → `packages/core/src/calendarUtils.ts`
- Update imports: `from "./types"` → `from "@goal-tracker/types"`
- Create `packages/core/src/index.ts` re-exporting all three
- Create `packages/core/package.json` and `tsconfig.json`

**Step 3: `packages/db`**
- Copy `prisma/` → `packages/db/prisma/`
- Copy `lib/db.ts` → `packages/db/src/client.ts`
- Copy `lib/tokens.ts` → `packages/db/src/tokens.ts`
- Create `packages/db/src/index.ts` exporting `{ prisma }` and `{ generateToken }`
- Update `prisma/schema.prisma` output path: `output = "../src/generated/client"`
- Create `packages/db/package.json` and `tsconfig.json`

**Step 4: `packages/api-client`**
- Write `src/client.ts`: base `apiFetch()` with optional Bearer token header injection
- Write `src/goals.ts`: typed wrappers — `getGoals()`, `createGoal()`, `updateGoalState()`, `deleteGoal()`, `addLog()`
- Write `src/auth.ts`: typed wrappers — `login()`, `register()`, `forgotPassword()`, etc.
- Create `src/index.ts` re-exporting all

### Phase 2 — Move the Web App (1–2 hrs)

1. Move all current root files into `apps/web/`:
   - `app/` → `apps/web/app/`
   - `components/` → `apps/web/components/`
   - `hooks/` → `apps/web/hooks/`
   - `lib/` → `apps/web/lib/` (keep `auth.ts`, `authz.ts`, `email.ts`, `syncAdmins.ts` only)
   - `types/` → `apps/web/types/`
   - `instrumentation.ts` → `apps/web/`
   - `next.config.js`, `tailwind.config.ts`, `postcss.config.js` → `apps/web/`
   - `docker-compose.yml` stays at root
2. Update `apps/web/package.json` with `workspace:*` deps
3. Global search-replace imports:
   - `@/lib/types` → `@goal-tracker/types`
   - `@/lib/calculations`, `@/lib/penalty`, `@/lib/calendarUtils` → `@goal-tracker/core`
   - `@/lib/db`, `@/lib/tokens` → `@goal-tracker/db`
4. `apps/web/tsconfig.json`: `extends "../../tsconfig.base.json"`, keep `@/*` alias pointing to `./`
5. Verify: `pnpm --filter=@goal-tracker/web dev` starts without errors

### Phase 3 — Migrate Web Hooks to React Query (2–3 hrs)

The current `hooks/useGoals.ts` is a hand-rolled React Query implementation (~80 lines of manual loading state and effect-based fetching). Migrate it:

1. Add `@tanstack/react-query` to `apps/web/package.json`
2. Wrap `SessionProvider` with `QueryClientProvider` in `components/Providers.tsx`
3. Rewrite `hooks/useGoals.ts` using `useQuery` / `useMutation` from TanStack Query
4. Replace raw `fetch` calls with `packages/api-client` functions

### Phase 4 — Mobile Auth Endpoints (1–2 hrs)

1. Add `POST /api/auth/token` to `apps/web/app/api/auth/token/route.ts`
   - Same credential check as `CredentialsProvider`
   - Signs and returns a JWT using `jose`, signed with `NEXTAUTH_SECRET`
   - Payload: `{ id, email, roles }`
2. Create `apps/web/lib/mobileAuth.ts`
   - Extracts and verifies `Authorization: Bearer <token>`
   - Returns `{ userId, roles }` — same shape as `requireAuth()`
3. Update each protected API route to check Bearer first, fall back to cookie session
   - Affected routes: goals CRUD, admin endpoints (~5 routes total)
   - Additive change — web app behavior unchanged

### Phase 5 — Scaffold Mobile App (2–4 hrs)

1. `cd apps && create-expo-app mobile --template bare-minimum`
2. Configure `metro.config.js` (see snippet above — this is the most critical step)
3. Add `package.json` deps:
   - `@goal-tracker/types`: `workspace:*`
   - `@goal-tracker/core`: `workspace:*`
   - `@goal-tracker/api-client`: `workspace:*`
   - `@tanstack/react-query`
   - `zustand`
   - `expo-secure-store`
   - `expo-router`
4. Create `lib/auth.ts` for JWT storage via `expo-secure-store`
5. Create Zustand store for auth state
6. Wire up `QueryClientProvider` in root `_layout.tsx`
7. Scaffold screens mirroring the web app routes

---

## Summary of Decisions

| Question | Decision |
|---|---|
| Monorepo tool | Turborepo |
| Package manager | pnpm (migrate from npm) |
| React Native | Expo bare workflow |
| Mobile targets | iOS + Android (not Web) |
| Component reuse | Business logic + types only; separate UI per platform |
| Next.js role | Full-stack (UI + API) serving both web and mobile |
| API protocol | REST (existing routes) via `@goal-tracker/api-client` |
| tRPC | No — add later if API surface grows significantly |
| Mobile auth | JWT Bearer via `POST /api/auth/token` + Expo SecureStore |
| State (server) | TanStack Query v5 |
| State (client) | Zustand |
| Env vars | Per-app `.env` files; no shared secrets |
| CI builds | Per-app jobs; web gets DB creds, mobile gets only `EXPO_PUBLIC_API_BASE_URL` |
