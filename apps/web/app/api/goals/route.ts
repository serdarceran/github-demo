import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@goal-tracker/db";
import { Goal } from "@goal-tracker/types";

// GET /api/goals?userId=<guestId>   (anonymous)
// GET /api/goals                     (authenticated â€” reads from session)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  let userId: string;
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    userId = req.nextUrl.searchParams.get("userId") ?? "";
    if (!userId) return NextResponse.json([]);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
// Body: { userId?: string (guest only); goal: Goal }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { goal }: { userId?: string; goal: Goal } = body;

  let userId: string;

  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    const guestId: string = body.userId;
    if (!guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Ensure guest user record exists
    await prisma.user.upsert({
      where: { id: guestId },
      update: {},
      create: { id: guestId, isGuest: true },
    });
    userId = guestId;

    // Assign guest role if not already assigned
    const guestRole = await prisma.role.findUnique({ where: { name: "guest" } });
    if (guestRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: guestId, roleId: guestRole.id } },
        update: {},
        create: { userId: guestId, roleId: guestRole.id },
      });
    }
  }

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
      userId,
    },
    include: { logs: true },
  });

  return NextResponse.json(toGoal(created), { status: 201 });
}

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
