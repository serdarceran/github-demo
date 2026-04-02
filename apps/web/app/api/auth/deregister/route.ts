import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendDeregistrationEmail } from "@/lib/email";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const deregistrationToken = generateToken();
  const deregistrationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { deregistrationToken, deregistrationTokenExpiry },
  });

  try {
    await sendDeregistrationEmail(session.user.email, deregistrationToken);
    console.log(`[deregister] Deregistration email sent to ${session.user.email}`);
  } catch (err) {
    console.error(`[deregister] Failed to send email to ${session.user.email}:`, err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
