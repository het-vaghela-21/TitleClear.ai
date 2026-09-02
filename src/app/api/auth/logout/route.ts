import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, clearSessionCookie } from "@/lib/auth/session";
import { deleteSession } from "@/lib/auth/store";

/**
 * POST /api/auth/logout
 *
 * Deletes the session record as well as the cookie, so the id is dead even
 * if a copy of it was captured. Always succeeds — signing out of an already
 * signed-out browser is not an error.
 */
export async function POST() {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (sessionId) await deleteSession(sessionId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
