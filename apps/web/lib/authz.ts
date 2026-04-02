import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { RoleName } from "@/lib/roles";

type AuthResult =
  | { userId: string; roles: string[] }
  | NextResponse;

/**
 * Returns the authenticated user's id and roles, or a 401 NextResponse.
 *
 * Usage in an API route:
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId, roles } = auth;
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, roles: session.user.roles ?? [] };
}

/**
 * Returns a 403 NextResponse if the current session does not include the given role, otherwise null.
 *
 * Usage:
 *   const denied = await requireRole("system-admin");
 *   if (denied) return denied;
 */
export async function requireRole(role: RoleName): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.roles?.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
