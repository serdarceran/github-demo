import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { deregistrationToken: token },
  });

  if (
    !user ||
    !user.deregistrationTokenExpiry ||
    user.deregistrationTokenExpiry < new Date()
  ) {
    return NextResponse.json(
      { error: "INVALID_OR_EXPIRED" },
      { status: 400 }
    );
  }

  // Delete goals first (DailyLogs cascade from Goal)
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true });
}
