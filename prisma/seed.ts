import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ROLE_NAMES = ["system-admin", "project-manager", "regular-user", "guest"] as const;

async function main() {
  // 1. Ensure all 4 roles exist
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const regularUserRole = await prisma.role.findUniqueOrThrow({ where: { name: "regular-user" } });
  const guestRole = await prisma.role.findUniqueOrThrow({ where: { name: "guest" } });

  // 2. Backfill existing users that have no roles yet
  const users = await prisma.user.findMany({ include: { userRoles: true } });

  for (const user of users) {
    if (user.userRoles.length > 0) continue; // already has roles, skip

    const roleToAssign = user.isGuest ? guestRole : regularUserRole;
    await prisma.userRole.create({
      data: { userId: user.id, roleId: roleToAssign.id },
    });
  }

  console.log(`[seed] Done. Roles created, ${users.length} user(s) processed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
