/**
 * Account types for the document library.
 *
 * Nothing here touches the filesystem or node crypto, so client components
 * can import `PublicUser` and the validation helpers. The record that
 * actually holds the password hash (`StoredUser`) never leaves the server —
 * see `store.ts`.
 */

/** What the browser is ever allowed to see about an account. */
export interface PublicUser {
  id: string;
  email: string;
}

/** Server-side account record. Never serialise this to a response. */
export interface StoredUser extends PublicUser {
  /** `scrypt:<saltHex>:<keyHex>` — see `password.ts`. */
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/* ------------------------------------------------------------------ */
/* Validation — shared so the form and the route agree on the rules    */
/* ------------------------------------------------------------------ */

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;
const MAX_EMAIL_LENGTH = 254;

/**
 * Deliberately loose. The only address that truly validates is one that
 * receives mail; anything stricter mostly rejects real addresses.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Lowercased and trimmed — the form the account is keyed on. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailProblem(email: string): string | null {
  const value = normalizeEmail(email);
  if (value === "") return "Enter your email address.";
  if (value.length > MAX_EMAIL_LENGTH) return "That email address is too long.";
  if (!EMAIL_SHAPE.test(value)) return "That doesn't look like an email address.";
  return null;
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return "That password is too long.";
  }
  return null;
}
