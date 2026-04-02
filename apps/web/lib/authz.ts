import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyBearerToken } from "@/lib/mobileAuth";
import { NextRequest, NextResponse } from "next/server";
import type { RoleName } from "@goal-tracker/types";

type AuthResult =
  | { userId: string; roles: string[] }
  | NextResponse;

/**
 * Returns the authenticated user's id and roles, or a 401 NextResponse.
 *
 * Checks Bearer token first (mobile), falls back to next-auth session (web).
 * Pass `req` from the route handler to support mobile clients.
 *
 * Usage in an API route:
 *   const auth = await requireAuth(req);
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId, roles } = auth;
 */
export async function requireAuth(req?: NextRequest): Promise<AuthResult> {
  // 1. Try Bearer token (mobile)
  if (req) {
    const mobile = await verifyBearerToken(req);
    if (mobile) return { userId: mobile.userId, roles: mobile.roles };
  }

  // 2. Fall back to next-auth session (web) — backward compatible
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, roles: session.user.roles ?? [] };
}

/**
 * Returns a 403 NextResponse if the caller does not have the given role, otherwise null.
 * Pass `req` to support mobile Bearer token auth.
 *
 * Usage:
 *   const denied = await requireRole("system-admin", req);
 *   if (denied) return denied;
 */
export async function requireRole(role: RoleName, req?: NextRequest): Promise<NextResponse | null> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (!result.roles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
