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

---

## Deploying to Vercel

### 1. Push your code to GitHub

Your repository must be hosted on GitHub, GitLab, or Bitbucket before importing into Vercel.

### 2. Provision a PostgreSQL database

Choose one of the following options:

- **Vercel Postgres** (easiest): In your Vercel dashboard go to Storage → Create Database → Postgres. It automatically sets the `DATABASE_URL` environment variable.
- **Neon** (free tier): Create a project at neon.tech and copy the connection string.
- **Supabase** (free tier): Create a project at supabase.com and copy the connection string.

### 3. Import the project on Vercel

1. Go to vercel.com → "Add New Project"
2. Import your GitHub repository
3. Vercel auto-detects Next.js — no framework configuration needed

### 4. Set environment variables

In your Vercel project settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

> Most managed Postgres providers require `?sslmode=require` at the end of the connection string.

### 5. Configure the build command to run migrations

In Vercel project settings → Build & Development Settings, set the **Build Command** to:

```bash
prisma generate && prisma migrate deploy && next build
```

Alternatively, add a `vercel.json` file at the project root:

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

This runs `prisma migrate deploy` (not `migrate dev`), which applies existing migrations non-interactively — the correct mode for production.

### 6. Deploy

Trigger a deployment. Vercel will run the build command, apply database migrations, and publish the app.

**Notes:**
- Always use `prisma migrate deploy` in production, never `prisma migrate dev`.
- If you experience connection issues at scale, consider using Prisma Accelerate or a connection pooler such as PgBouncer, as Vercel's serverless functions can open many short-lived database connections.