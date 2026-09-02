# Accounts and sessions

Email-and-password accounts, so uploaded documents belong to someone. Built
on node's own crypto and the filesystem — no auth library, no database, no
secret to configure.

Only the document library requires an account. A title check, the jantri
lookup and the document drafter all still work signed out; the login page says
so.

## Layout

```
storage/auth/users/<userId>.json       StoredUser, including the password hash
storage/auth/sessions/<sessionId>.json Session
```

`userId` is `sha256(normalised email)`. That makes both lookups the app needs
— by email at login, by id from a session — a direct file read, with no index
to keep consistent. It is not a secret and not a credential: anyone holding
the email can derive it. **The session id is the credential**, and that is 256
random bits from `randomBytes`.

## The pieces

| File | Does |
|---|---|
| `types.ts` | `PublicUser`, `StoredUser`, `Session`, and the email/password rules the form and the routes share. No node imports — client components import it. |
| `password.ts` | scrypt hashing and constant-time verification. |
| `store.ts` | Accounts and sessions on disk. |
| `session.ts` | The cookie, and `currentUser()` — the one call every protected route makes. |
| `cookie.ts` | Just the cookie name, so `proxy.ts` can import it without pulling in `server-only` code. |
| `throttle.ts` | Per-process brake on password guessing. |

Routes live in `src/app/api/auth/`: `signup`, `login`, `logout`, `me`.

## Decisions worth knowing

**Passwords are hashed with scrypt**, node's built-in memory-hard KDF —
16-byte random salt per user, 64-byte key, stored as
`scrypt:<saltHex>:<keyHex>`. The scheme prefix means a later move to argon2
can rehash on next login instead of locking everyone out. Verification is
`timingSafeEqual`.

**Sessions are server-side records, not signed tokens.** The cookie holds an
opaque id and nothing else. That costs a file read per request and buys real
revocation: logging out deletes the record, so a captured cookie dies with it
rather than staying valid until it expires.

**The cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, 30 days**, and `Secure`
in production (off in dev so it works over http on localhost). `HttpOnly`
keeps an XSS from lifting the session; `SameSite=Lax` is also what stands in
for CSRF tokens here — the cookie is not sent on cross-site POSTs, so another
origin cannot make a state-changing request as the user.

**Login gives one answer for every failure.** Wrong password and unknown
account return the same message, and `verifyUser` runs a throwaway hash on the
miss so the two take the same time — measured at ~8% apart, which is noise.
Without that, response time alone would list who has an account.

**Signup does say when an address is taken.** That leaks the same thing login
protects, and it is a deliberate trade: the alternative — pretending to
succeed — leaves a real person unable to work out why they can't get in. This
is the standard trade-off, but it is a trade-off.

**`proxy.ts` is not the security boundary.** It redirects signed-out visitors
away from `/documents/library` before the page renders, checking only that a
cookie *exists* — proxy code runs before rendering and must not reach for the
session store. Every API route re-checks properly with `currentUser()`. A
forged cookie sails past the proxy and straight into a 401.

**The header asks `/api/auth/me` from the client** rather than reading the
session during render. Reading cookies in `SiteHeader` would opt every page
that uses it — the landing page included — out of static rendering for the
sake of one label.

## Not built yet

- **Email verification and password reset.** There is no mail provider wired
  up, so a forgotten password currently means a lost account.
- **The throttle is per-process and in memory.** It resets on restart and is
  not shared between instances. Enough to make online guessing impractical;
  not a substitute for a shared store once this runs on more than one node.
- **No "sign out everywhere"**, no session listing, no device names.
- **No roles.** Every account is an ordinary user; there is no admin.
- **No rotation on privilege change**, because there are no privileges yet.
