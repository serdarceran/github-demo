# github-demo
A Simple Demo for GitHub

 Getting started

  Local dev

  # 1. Start PostgreSQL
  docker-compose up -d

  # 2. Run migrations (creates tables)
  npm run db:migrate   # prompts for a migration name

  # 3. Start the app
  npm run dev

  Production (Hetzner VM)

  1. Edit .env on the VM, switch the DATABASE_URL to point at the VM's PostgreSQL.
  2. Run npm run db:migrate:prod — this runs prisma migrate deploy (no prompts, safe for CI/CD).

  Switching environments

  Only the DATABASE_URL in .env needs to change. Comment/uncomment the appropriate line:

  # Local
  DATABASE_URL="postgresql://goaltracker:goaltracker@localhost:5432/goaltracker"

  # Production (Hetzner)
  # DATABASE_URL="postgresql://goaltracker:<password>@<hetzner-ip>:5432/goaltracker"

  ---
  Architecture

  Browser (useGoals hook)
    │  client-side penalty logic runs here
    │  optimistic UI updates
    │
    ├── GET  /api/goals?username=X     → load goals + logs
    ├── POST /api/goals                → create goal
    ├── PATCH /api/goals/[id]          → update goal state after logging
    ├── POST  /api/goals/[id]/logs     → upsert daily log entry
    └── DELETE /api/goals/[id]         → delete goal

  API Routes (server-only)
    └── lib/db.ts (Prisma singleton)
          └── PostgreSQL