import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Goal } from "@/lib/types";

// GET /api/goals?username=<name>
// Returns all goals (with logs) for the given user.
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json([]);

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      goals: {
        include: { logs: { orderBy: { date: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) return NextResponse.json([]);
  return NextResponse.json(user.goals.map(toGoal));
}

// POST /api/goals
// Body: { username: string; goal: Goal }
// Creates the user if needed, then persists the goal.
export async function POST(req: NextRequest) {
  const { username, goal }: { username: string; goal: Goal } = await req.json();

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username },
  });

  const created = await prisma.goal.create({
    data: {
      id: goal.id,
      name: goal.name,
      unit: goal.unit,
      dailyTarget: goal.dailyTarget,
      difficulty: goal.difficulty,
      badgeName: goal.badgeName,
      startDate: goal.startDate,
      endDate: goal.endDate,
      status: goal.status,
      cumulativeTotal: goal.cumulativeTotal,
      totalDebt: goal.totalDebt,
      nextDayMultiplier: goal.nextDayMultiplier,
      streak: goal.streak,
      userId: user.id,
    },
    include: { logs: true },
  });

  return NextResponse.json(toGoal(created), { status: 201 });
}

// Maps a Prisma goal row (with logs) to the frontend Goal type.
function toGoal(g: any): Goal {
  return {
    id: g.id,
    name: g.name,
    unit: g.unit,
    dailyTarget: g.dailyTarget,
    difficulty: g.difficulty,
    badgeName: g.badgeName,
    startDate: g.startDate,
    endDate: g.endDate,
    status: g.status,
    cumulativeTotal: g.cumulativeTotal,
    totalDebt: g.totalDebt,
    nextDayMultiplier: g.nextDayMultiplier,
    streak: g.streak,
    createdAt: g.createdAt.toISOString(),
    logs: (g.logs ?? []).map((l: any) => ({
      date: l.date,
      value: l.value,
      required: l.required,
      missed: l.missed,
    })),
  };
}
