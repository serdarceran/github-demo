import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("system-admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      isGuest: true,
      createdAt: true,
      userRoles: { select: { role: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      isGuest: u.isGuest,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur) => ur.role.name),
    }))
  );
}
