import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { createSession, verifyUser } from "@/lib/auth/store";
import { clearFailures, clientKey, recordFailure, throttleState } from "@/lib/auth/throttle";
import { normalizeEmail } from "@/lib/auth/types";

/**
 * POST /api/auth/login  { email, password }
 *
 * One message for every failure — wrong password and unknown account are
 * indistinguishable from out here, so this endpoint can't be used to find out
 * who has an account. `verifyUser` also spends the same time on both.
 */
const GENERIC_FAILURE = "Email or password is incorrect.";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  const password = typeof body?.password === "string" ? body.password : "";

  if (email === "" || password === "") {
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  const key = clientKey(request, email);
  const throttle = throttleState(key);
  if (throttle.blocked) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  const user = await verifyUser(email, password);
  if (!user) {
    recordFailure(key);
    return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
  }

  clearFailures(key);
  const session = await createSession(user.id);
  await setSessionCookie(session.id);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
