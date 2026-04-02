import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@goal-tracker/db";
import { Goal } from "@goal-tracker/types";
import { verifyBearerToken } from "@/lib/mobileAuth";
import { corsHeaders, optionsResponse } from "@/lib/cors";

export function OPTIONS() {
  return optionsResponse();
}

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  const mobile = await verifyBearerToken(req);
  if (mobile?.userId) return mobile.userId;

  return null;
}

// GET /api/goals?userId=<guestId>   (anonymous)
// GET /api/goals                     (authenticated — reads from session or Bearer)
export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);

  const guestId = !userId ? (req.nextUrl.searchParams.get("userId") ?? "") : null;
  const effectiveId = userId ?? guestId;

  if (!effectiveId) return NextResponse.json([], { headers: corsHeaders });

  const user = await prisma.user.findUnique({
    where: { id: effectiveId },
    include: {
      goals: {
        include: { logs: { orderBy: { date: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) return NextResponse.json([], { headers: corsHeaders });
  return NextResponse.json(user.goals.map(toGoal), { headers: corsHeaders });
}

// POST /api/goals
// Body: { userId?: string (guest only); goal: Goal }
export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  const body = await req.json();
  const { goal }: { userId?: string; goal: Goal } = body;

  let effectiveUserId: string;

  if (userId) {
    effectiveUserId = userId;
  } else {
    const guestId: string = body.userId;
    if (!guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    await prisma.user.upsert({
      where: { id: guestId },
      update: {},
      create: { id: guestId, isGuest: true },
    });
    effectiveUserId = guestId;

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
      userId: effectiveUserId,
    },
    include: { logs: true },
  });

  return NextResponse.json(toGoal(created), { status: 201, headers: corsHeaders });
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
