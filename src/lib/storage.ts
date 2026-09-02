import "server-only";

import path from "node:path";

/**
 * Root of everything this app persists to disk: uploaded documents, user
 * records, sessions. Gitignored, and outside `src/` so nothing here is ever
 * bundled or served statically.
 *
 * A plain directory on purpose — this phase is local demo work. Swapping in
 * a database or object storage later means reimplementing the few store
 * modules that call this, not the routes above them.
 */
const ROOT = process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage");

/** A path segment that could escape the storage root. */
const UNSAFE = /[/\\]|^\.\.?$/;

/**
 * Build a path inside the storage root.
 *
 * Every segment is checked for separators and `..` even though all current
 * callers pass values they have already validated (uuids, hex ids, sanitized
 * extensions) — this is the one place a traversal bug could reach the
 * filesystem, so it refuses rather than trusts.
 *
 * `turbopackIgnore` because ROOT is a runtime location, not a build input:
 * STORAGE_DIR makes it non-statically-analysable, and without the annotation
 * Turbopack traces the whole project into the server bundle "just in case".
 */
export function storagePath(...segments: string[]): string {
  for (const segment of segments) {
    if (segment === "" || UNSAFE.test(segment)) {
      throw new Error(`Unsafe storage path segment: ${JSON.stringify(segment)}`);
    }
  }
  return path.join(/*turbopackIgnore: true*/ ROOT, ...segments);
}
