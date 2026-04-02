import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PATCH /api/goals/:id
// Updates mutable goal fields after a log is applied client-side.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { status, cumulativeTotal, totalDebt, nextDayMultiplier, streak } = body;

  const updated = await prisma.goal.update({
    where: { id: params.id },
    data: { status, cumulativeTotal, totalDebt, nextDayMultiplier, streak },
  });

  return NextResponse.json(updated);
}

// DELETE /api/goals/:id
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.goal.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
