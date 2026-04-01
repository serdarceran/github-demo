import { prisma } from "@/lib/db";

/**
 * Called once on server startup via instrumentation.ts.
 * Ensures every email in SYSTEM_ADMIN_EMAILS has the system-admin role in the DB.
 * This is the source of truth — it cannot be overridden via the admin panel.
 */
export async function syncSystemAdmins(): Promise<void> {
  const raw = process.env.SYSTEM_ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emails.length === 0) return;

  const adminRole = await prisma.role.upsert({
    where: { name: "system-admin" },
    update: {},
    create: { name: "system-admin" },
  });

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
      update: {},
      create: { userId: user.id, roleId: adminRole.id },
    });
  }

  console.log(`[RBAC] system-admin synced for: ${emails.join(", ")}`);
}
