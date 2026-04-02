import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@goal-tracker/db";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/tokens";
import { sendActivationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, password, guestId } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "An account with this email already exists. Use 'Forgot password' if you can't sign in.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const activationToken = generateToken();
  const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      activationToken,
      activationTokenExpiry,
    },
  });

  const regularUserRole = await prisma.role.findUnique({ where: { name: "regular-user" } });
  if (regularUserRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: regularUserRole.id },
    });
  }

  // Migrate guest goals to the new user
  if (guestId) {
    const guestUser = await prisma.user.findUnique({ where: { id: guestId } });
    if (guestUser?.isGuest) {
      await prisma.goal.updateMany({
        where: { userId: guestId },
        data: { userId: user.id },
      });
      await prisma.user.delete({ where: { id: guestId } });
    }
  }

  try {
    await sendActivationEmail(email, activationToken);
    console.log(`[register] Activation email sent to ${email}`);
  } catch (err) {
    console.error(`[register] Failed to send activation email to ${email}:`, err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
