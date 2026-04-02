import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

// PUT /api/admin/users/[id]/roles
// Body: { roles: string[] }
// Replaces all assignable roles for the user. system-admin is never touched.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes("system-admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: { roles: string[] } = await req.json();

  // Strip any attempt to set system-admin via this endpoint
  const safeRoles = body.roles.filter((r): r is string =>
    (ASSIGNABLE_ROLES as string[]).includes(r)
  );

  const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Remove all current assignable roles for this user
  await prisma.userRole.deleteMany({
    where: {
      userId: params.id,
      role: { name: { in: ASSIGNABLE_ROLES as string[] } },
    },
  });

  // Create the new set of assignable roles
  for (const roleName of safeRoles) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    await prisma.userRole.create({ data: { userId: params.id, roleId: role.id } });
  }

  const updated = await prisma.user.findUnique({
    where: { id: params.id },
    include: { userRoles: { include: { role: true } } },
  });

  return NextResponse.json({
    id: params.id,
    roles: updated!.userRoles.map((ur) => ur.role.name),
  });
}
