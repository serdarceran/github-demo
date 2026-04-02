import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@goal-tracker/db";

// PATCH /api/goals/:id
// Body: { status, cumulativeTotal, totalDebt, nextDayMultiplier, streak }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;
  const body = await req.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session?.user?.id) {
    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.goal.update({
    where: { id },
    data: {
      status: body.status,
      cumulativeTotal: body.cumulativeTotal,
      totalDebt: body.totalDebt,
      nextDayMultiplier: body.nextDayMultiplier,
      streak: body.streak,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/goals/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session?.user?.id) {
    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.goal.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
