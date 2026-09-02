import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { storagePath } from "@/lib/storage";
import { hashPassword, verifyPassword } from "./password";
import { normalizeEmail, type Session, type StoredUser } from "./types";

/**
 * File-backed accounts and sessions.
 *
 *   storage/auth/users/<userId>.json      StoredUser (includes the hash)
 *   storage/auth/sessions/<sessionId>.json  Session
 *
 * The user id is `sha256(normalised email)`, which makes both lookups the
 * app needs — by email at login, by id from a session — a direct file read
 * with no index to keep consistent. It is not a secret and is not a
 * credential: anyone holding the email can derive it. The session id is the
 * credential, and that is 256 random bits.
 */

const USERS = "users";
const SESSIONS = "sessions";
const AUTH = "auth";

/** Both ids are 64 lowercase hex chars; anything else never reaches the disk. */
const HEX_64 = /^[0-9a-f]{64}$/;

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function userPath(userId: string): string {
  return storagePath(AUTH, USERS, `${userId}.json`);
}

function sessionPath(sessionId: string): string {
  return storagePath(AUTH, SESSIONS, `${sessionId}.json`);
}

async function ensureDirs(): Promise<void> {
  await mkdir(/*turbopackIgnore: true*/ storagePath(AUTH, USERS), { recursive: true });
  await mkdir(/*turbopackIgnore: true*/ storagePath(AUTH, SESSIONS), { recursive: true });
}

/** Stable, derived — the same email always maps to the same account id. */
export function userIdForEmail(email: string): string {
  return createHash("sha256").update(normalizeEmail(email), "utf8").digest("hex");
}

export function isValidUserId(id: string): boolean {
  return HEX_64.test(id);
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export async function getUser(userId: string): Promise<StoredUser | null> {
  if (!HEX_64.test(userId)) return null;
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ userPath(userId), "utf-8"));
  } catch {
    return null;
  }
}

/** Creates an account, or returns null if one already exists for that email. */
export async function createUser(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const normalized = normalizeEmail(email);
  const id = userIdForEmail(normalized);
  if (await getUser(id)) return null;

  const user: StoredUser = {
    id,
    email: normalized,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  await ensureDirs();
  // `wx` fails rather than overwrites, so two signups racing on the same
  // address can't have the second silently replace the first.
  try {
    await writeFile(/*turbopackIgnore: true*/ userPath(id), JSON.stringify(user, null, 2), {
      encoding: "utf-8",
      flag: "wx",
    });
  } catch {
    return null;
  }
  return user;
}

/**
 * Returns the account only when the password matches.
 *
 * A miss still runs a hash: without it, "no such account" would return
 * measurably faster than "wrong password" and hand out a list of who has
 * signed up.
 */
export async function verifyUser(
  email: string,
  password: string,
): Promise<StoredUser | null> {
  const user = await getUser(userIdForEmail(email));
  if (!user) {
    await verifyPassword(password, `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`);
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export async function createSession(userId: string): Promise<Session> {
  const now = Date.now();
  const session: Session = {
    id: randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  await ensureDirs();
  await writeFile(
    /*turbopackIgnore: true*/ sessionPath(session.id),
    JSON.stringify(session, null, 2),
    "utf-8",
  );
  return session;
}

/** Null for unknown or expired sessions; an expired one is cleaned up. */
export async function getSession(sessionId: string): Promise<Session | null> {
  if (!HEX_64.test(sessionId)) return null;

  let session: Session;
  try {
    session = JSON.parse(await readFile(/*turbopackIgnore: true*/ sessionPath(sessionId), "utf-8"));
  } catch {
    return null;
  }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    await deleteSession(sessionId);
    return null;
  }
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!HEX_64.test(sessionId)) return;
  await rm(/*turbopackIgnore: true*/ sessionPath(sessionId), { force: true });
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
