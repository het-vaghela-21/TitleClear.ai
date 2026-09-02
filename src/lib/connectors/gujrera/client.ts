import { constants as tlsConstants, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Agent } from "undici";
import { ManualHandlingRequiredError } from "../registry";

const BASE_URL = "https://gujrera.gujarat.gov.in";

/**
 * gujrera.gujarat.gov.in's server-side TLS stack expects legacy
 * renegotiation, which Node's OpenSSL 3.x rejects by default (browsers
 * tolerate it at the OS/TLS-library level, Node doesn't). This is a plain
 * TLS interoperability setting for an outdated server config — unrelated
 * to auth, captcha, or bot-detection — confirmed during the trial
 * investigation (see NOTES.md). Without it every request fails with
 * ERR_SSL_UNSAFE_LEGACY_RENEGOTIATION_DISABLED before a single byte of
 * response is seen, i.e. before we could possibly tell whether we were
 * blocked.
 */
const legacyRenegotiationAgent = new Agent({
  connect: { secureOptions: tlsConstants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION },
});

/**
 * Trial constraint: be a polite client. One request in flight at a time,
 * spaced at least MIN_INTERVAL_MS apart, regardless of how many callers ask
 * for data concurrently.
 */
const MIN_INTERVAL_MS = 2500;
const MAX_RETRIES = 3;
const CACHE_DIR = path.join(process.cwd(), "src/lib/connectors/gujrera/__cache__");
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h — long enough to avoid re-hitting the server while iterating locally

let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKeyFor(url: string, init?: RequestInit) {
  const hash = createHash("sha256");
  hash.update(url);
  if (init?.body) hash.update(String(init.body));
  return hash.digest("hex");
}

async function readCache(key: string): Promise<unknown | undefined> {
  try {
    const raw = await readFile(path.join(CACHE_DIR, `${key}.json`), "utf8");
    const entry = JSON.parse(raw) as { cachedAt: number; payload: unknown };
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return undefined;
    return entry.payload;
  } catch {
    return undefined;
  }
}

async function writeCache(key: string, payload: unknown) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(
    path.join(CACHE_DIR, `${key}.json`),
    JSON.stringify({ cachedAt: Date.now(), payload }, null, 2),
  );
}

/**
 * Heuristic guard for the hard constraint: never solve or work around a
 * captcha/login wall. We didn't encounter one against the public search
 * endpoints during the trial investigation (see NOTES.md), but this stays
 * in place as a tripwire — a non-JSON or login-shaped response stops the
 * connector instead of being parsed as data.
 */
function assertNotBlocked(status: number, contentType: string | null, bodyPreview: string) {
  if (status === 401 || status === 403) {
    throw new ManualHandlingRequiredError(`HTTP ${status} from GujRERA — likely an auth/bot wall`);
  }
  if (contentType && !contentType.includes("application/json")) {
    throw new ManualHandlingRequiredError(
      `Expected JSON, got "${contentType}" — likely a login page or challenge screen`,
    );
  }
  const lower = bodyPreview.toLowerCase();
  if (lower.includes("captcha") || lower.includes("recaptcha")) {
    throw new ManualHandlingRequiredError("Response body mentions a captcha");
  }
}

/**
 * Rate-limited, cached, retrying JSON fetch against the GujRERA portal.
 * Every call goes through a single queue so concurrent lookups still only
 * hit the server one at a time, MIN_INTERVAL_MS apart.
 */
export async function gujreraFetchJson(
  urlPath: string,
  init?: RequestInit,
): Promise<unknown> {
  const url = `${BASE_URL}${urlPath}`;
  const key = cacheKeyFor(url, init);

  const cached = await readCache(key);
  if (cached !== undefined) return cached;

  const run = async () => {
    const waitFor = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now());
    if (waitFor > 0) await sleep(waitFor);

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      lastRequestAt = Date.now();
      try {
        const res = await fetch(url, {
          ...init,
          headers: {
            "User-Agent": "TitleClearAI-GujReraTrialBot/0.1 (+contact: research trial, single-lookup, read-only)",
            Accept: "application/json",
            "Content-Type": "application/json",
            ...init?.headers,
          },
          // @ts-expect-error -- `dispatcher` is an undici/Node-fetch extension, not in the standard RequestInit type
          dispatcher: legacyRenegotiationAgent,
        });
        const text = await res.text();
        assertNotBlocked(res.status, res.headers.get("content-type"), text.slice(0, 500));

        if (!res.ok) {
          throw new Error(`GujRERA request failed: ${res.status} ${res.statusText}`);
        }

        const json = JSON.parse(text);
        await writeCache(key, json);
        return json;
      } catch (err) {
        if (err instanceof ManualHandlingRequiredError) throw err;
        lastError = err;
        if (attempt < MAX_RETRIES) {
          const backoffMs = 2 ** attempt * 1000 + Math.random() * 250;
          await sleep(backoffMs);
        }
      }
    }
    throw lastError;
  };

  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

export function gujreraDocMetadataUrl(uid: string) {
  return `${BASE_URL}/vdms/getDocMetadata/${uid}`;
}

export function gujreraDocDownloadUrl(uid: string) {
  return `${BASE_URL}/vdms/download/${uid}`;
}

export async function gujreraFetchDocMetadata(uid: string): Promise<unknown> {
  return gujreraFetchJson(`/vdms/getDocMetadata/${uid}`);
}
