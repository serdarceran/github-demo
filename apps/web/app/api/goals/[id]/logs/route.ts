import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@goal-tracker/db";

// POST /api/goals/:id/logs
// Body: { date, value, required, missed }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { date, value, required, missed } = await req.json();

  const log = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId: id, date } },
    update: { value, required, missed },
    create: { goalId: id, date, value, required, missed },
  });

  return NextResponse.json(log, { status: 201 });
}
