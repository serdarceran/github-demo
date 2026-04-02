import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export interface MobileAuthPayload {
  userId: string;
  email: string;
  roles: string[];
}

export async function verifyBearerToken(
  req: NextRequest,
): Promise<MobileAuthPayload | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.id as string,
      email: payload.email as string,
      roles: (payload.roles as string[]) ?? [],
    };
  } catch {
    return null;
  }
}
