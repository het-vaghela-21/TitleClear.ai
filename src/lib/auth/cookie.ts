/**
 * The session cookie's name, on its own so `proxy.ts` can import it.
 *
 * `session.ts` is `server-only` and pulls in `next/headers`; proxy code runs
 * before rendering and must not depend on either. A bare string constant is
 * safe to share with it — everything that actually touches the session still
 * lives in `session.ts`.
 */
export const SESSION_COOKIE = "titleclear_session";
