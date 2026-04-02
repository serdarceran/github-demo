import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@goal-tracker/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { activationToken: token },
  });

  if (
    !user ||
    !user.activationTokenExpiry ||
    user.activationTokenExpiry < new Date()
  ) {
    return NextResponse.json(
      { error: "INVALID_OR_EXPIRED" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      activationToken: null,
      activationTokenExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
