import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@goal-tracker/db";
import { generateToken } from "@/lib/tokens";
import { sendPasswordResetEmail, sendActivationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return ok to avoid email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Account exists but not yet activated â€” resend activation email instead
  if (!user.emailVerified) {
    try {
      await sendActivationEmail(email, user.activationToken!);
      console.log(`[forgot-password] Resent activation email to ${email}`);
    } catch (err) {
      console.error(`[forgot-password] Failed to resend activation email to ${email}:`, err);
    }
    return NextResponse.json({ ok: true });
  }

  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry },
  });

  try {
    await sendPasswordResetEmail(email, resetToken);
    console.log(`[forgot-password] Reset email sent to ${email}`);
  } catch (err) {
    console.error(`[forgot-password] Failed to send reset email to ${email}:`, err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
