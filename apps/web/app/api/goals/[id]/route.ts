import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@goal-tracker/db";
import { verifyBearerToken } from "@/lib/mobileAuth";
import { corsHeaders, optionsResponse } from "@/lib/cors";

export function OPTIONS() {
  return optionsResponse();
}

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;
  const mobile = await verifyBearerToken(req);
  return mobile?.userId ?? null;
}

// PATCH /api/goals/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await resolveUserId(req);
  const { id } = params;
  const body = await req.json();

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  if (userId && goal.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
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

  return NextResponse.json(updated, { headers: corsHeaders });
}

// DELETE /api/goals/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await resolveUserId(req);
  const { id } = params;

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

  if (userId && goal.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
  }

  await prisma.goal.delete({ where: { id } });

  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
