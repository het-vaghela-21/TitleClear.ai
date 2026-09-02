import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";

/**
 * GET /api/auth/me → { user } | { user: null }
 *
 * Who the browser is signed in as. Not an error when signed out — the header
 * and the library page both use this to decide what to render.
 */
export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
