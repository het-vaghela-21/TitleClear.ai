import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * Sends signed-out visitors to the login page before the library renders, so
 * they get the form instead of a page that flashes and then redirects.
 *
 * **This is a redirect, not the security boundary.** It only checks that a
 * cookie is present — it does not and cannot validate it, because proxy code
 * runs before rendering and must not reach for the session store. Every
 * `/api/documents/library` route re-checks the session properly with
 * `currentUser()`, and that is what actually protects the files. A forged
 * cookie gets past this and straight into a 401.
 *
 * (`middleware.ts` was renamed to `proxy.ts` in Next.js 16; the export must
 * be named `proxy`.)
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/documents/library", "/documents/library/:path*"],
};
