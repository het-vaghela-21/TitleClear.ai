import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with scrypt from node's own crypto — no dependency, and
 * a memory-hard KDF rather than a plain digest, so a stolen store is
 * expensive to attack offline.
 *
 * Stored form: `scrypt:<saltHex>:<keyHex>`. The scheme prefix is there so a
 * later move to argon2 can rehash on next login instead of locking everyone
 * out: check the prefix, verify with the old scheme, write back the new one.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const SCHEME = "scrypt";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** NFKC so the same typed password matches whatever form the OS sent it in. */
function prepare(password: string): string {
  return password.normalize("NFKC");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scryptAsync(prepare(password), salt, KEY_BYTES);
  return `${SCHEME}:${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== SCHEME || !saltHex || !keyHex) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(keyHex, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_BYTES) return false;

  const key = await scryptAsync(prepare(password), Buffer.from(saltHex, "hex"), KEY_BYTES);
  // Constant-time: a length check first, since timingSafeEqual throws on a
  // mismatch, then the comparison itself.
  return key.length === expected.length && timingSafeEqual(key, expected);
}
