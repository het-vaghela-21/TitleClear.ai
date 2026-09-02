import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { createSession, createUser } from "@/lib/auth/store";
import { emailProblem, normalizeEmail, passwordProblem } from "@/lib/auth/types";

/**
 * POST /api/auth/signup  { email, password }
 *
 * Creates the account and signs it straight in.
 *
 * Unlike login, this does say when an address is already registered. That
 * leaks whether someone has an account here, and the alternative — pretending
 * to succeed — leaves a real person unable to work out why they can't get in.
 * Standard trade-off; noted in the module README.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const problem = emailProblem(email) ?? passwordProblem(password);
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  const user = await createUser(normalizeEmail(email), password);
  if (!user) {
    return NextResponse.json(
      { error: "An account with this email already exists. Log in instead." },
      { status: 409 },
    );
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.id);

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}
