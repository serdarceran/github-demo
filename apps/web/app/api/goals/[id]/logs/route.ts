import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DailyLog } from "@/lib/types";

// POST /api/goals/:id/logs
// Upserts a daily log entry for the given goal.
// If a log already exists for that date, it is overwritten.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const log: DailyLog = await req.json();

  const upserted = await prisma.dailyLog.upsert({
    where: { goalId_date: { goalId: params.id, date: log.date } },
    update: { value: log.value, required: log.required, missed: log.missed },
    create: {
      goalId: params.id,
      date: log.date,
      value: log.value,
      required: log.required,
      missed: log.missed,
    },
  });

  return NextResponse.json(upserted, { status: 201 });
}
