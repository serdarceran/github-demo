import { PrismaClient } from "@prisma/client";

// Singleton pattern: prevents multiple PrismaClient instances during Next.js hot-reload in dev.
// In production a single instance is created per process.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
