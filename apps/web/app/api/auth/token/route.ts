import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@goal-tracker/db";
import bcrypt from "bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400, headers: corsHeaders });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403, headers: corsHeaders });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: corsHeaders });
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: { role: true },
  });
  const roles = userRoles.map((ur) => ur.role.name);

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const token = await new SignJWT({ id: user.id, email: user.email!, roles })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return NextResponse.json({ token }, { headers: corsHeaders });
}
