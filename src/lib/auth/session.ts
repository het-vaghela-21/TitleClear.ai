import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "./cookie";
import { SESSION_MAX_AGE_SECONDS, getSession, getUser } from "./store";
import type { PublicUser } from "./types";

/**
 * The session cookie and the one function every protected route calls.
 *
 * The cookie holds an opaque random session id, never the user id and never
 * anything signed — the record it points at lives on the server, so logging
 * out actually revokes it rather than just asking the browser to forget.
 */

export { SESSION_COOKIE };

const COOKIE_OPTIONS = {
  httpOnly: true, // never readable from JS, so an XSS can't lift the session
  sameSite: "lax" as const, // survives normal navigation, not cross-site POSTs
  path: "/",
  // Off in dev so the cookie works over plain http on localhost.
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/**
 * The signed-in account, or null. This is the security boundary — `proxy.ts`
 * only checks whether a cookie is present, which is a redirect optimisation
 * and proves nothing.
 */
export async function currentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await getSession(sessionId);
  if (!session) return null;

  const user = await getUser(session.userId);
  // The account could have been deleted while the session lived on.
  return user ? { id: user.id, email: user.email } : null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The 401 every protected route returns, so the wording stays in one place. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
}
