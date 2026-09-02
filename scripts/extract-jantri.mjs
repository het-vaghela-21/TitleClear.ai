/**
 * One-time extractor: pulls the embedded ASR-2011 Vadodara jantri dataset out
 * of the mentor-supplied demo HTML and writes it as JSON into
 * src/lib/jantri/vadodara/. Kept in the repo so the data's provenance and
 * shape validation are reproducible.
 *
 *   node scripts/extract-jantri.mjs "<path to Vadodara Jantri.html>"
 *
 * Expected embedded shape (verified against the demo's own lookup logic):
 *   DATA.corp: [{ t, v, z, r: (number|null)[7], s: string[], f?: 1 }]
 *     7 rates: open plot res / flat / office / shop / open plot ind /
 *              agri piyat / agri bin-piyat — ₹ per sq.m (ASR-2011)
 *   DATA.na:   [{ t, v, rows: [{ s: string[], c, r: (number|null)[4] }],
 *                gr?, gc? }]   (gamtal residential / commercial)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/extract-jantri.mjs <demo html path>");
  process.exit(1);
}

const html = readFileSync(src, "utf8");
const m = html.match(/const DATA=(\{.*)/);
if (!m) {
  console.error("const DATA= not found in the file");
  process.exit(1);
}
// The object may or may not end with a semicolon on the same line.
let raw = m[1].trim();
if (raw.endsWith(";")) raw = raw.slice(0, -1);
const data = JSON.parse(raw);

// ---- validate ----
const problems = [];
const isRate = (x) => x === null || (typeof x === "number" && x >= 0);

if (!Array.isArray(data.corp)) problems.push("corp missing");
if (!Array.isArray(data.na)) problems.push("na missing");

let corpSurveyTokens = 0;
for (const [i, z] of (data.corp ?? []).entries()) {
  if (typeof z.t !== "string" || typeof z.v !== "string" || typeof z.z !== "string")
    problems.push(`corp[${i}] bad t/v/z`);
  if (!Array.isArray(z.r) || z.r.length !== 7 || !z.r.every(isRate))
    problems.push(`corp[${i}] bad rates`);
  if (!Array.isArray(z.s) || !z.s.every((s) => typeof s === "string"))
    problems.push(`corp[${i}] bad surveys`);
  if (z.f !== undefined && z.f !== 1 && z.f !== 0) problems.push(`corp[${i}] bad f flag`);
  corpSurveyTokens += z.s?.length ?? 0;
  const known = new Set(["t", "v", "z", "r", "s", "f"]);
  for (const k of Object.keys(z)) if (!known.has(k)) problems.push(`corp[${i}] unknown key ${k}`);
}

let naRows = 0, naSurveyTokens = 0;
for (const [i, r] of (data.na ?? []).entries()) {
  if (typeof r.t !== "string" || typeof r.v !== "string") problems.push(`na[${i}] bad t/v`);
  if (!Array.isArray(r.rows)) problems.push(`na[${i}] rows missing`);
  for (const [j, row] of (r.rows ?? []).entries()) {
    if (!Array.isArray(row.s) || !row.s.every((s) => typeof s === "string"))
      problems.push(`na[${i}].rows[${j}] bad surveys`);
    if (typeof row.c !== "string") problems.push(`na[${i}].rows[${j}] bad class`);
    if (!Array.isArray(row.r) || row.r.length !== 4 || !row.r.every(isRate))
      problems.push(`na[${i}].rows[${j}] bad rates`);
    naRows++;
    naSurveyTokens += row.s?.length ?? 0;
  }
  if (r.gr !== undefined && !isRate(r.gr)) problems.push(`na[${i}] bad gr`);
  if (r.gc !== undefined && !isRate(r.gc)) problems.push(`na[${i}] bad gc`);
  const known = new Set(["t", "v", "rows", "gr", "gc"]);
  for (const k of Object.keys(r)) if (!known.has(k)) problems.push(`na[${i}] unknown key ${k}`);
}

if (problems.length) {
  console.error("VALIDATION FAILED:");
  for (const p of problems.slice(0, 30)) console.error("  - " + p);
  process.exit(1);
}

// ---- stats ----
const corpVillages = new Set(data.corp.map((z) => z.t + "|" + z.v));
const corpTalukas = new Set(data.corp.map((z) => z.t));
const naTalukas = new Set(data.na.map((r) => r.t));
const allRates = [
  ...data.corp.flatMap((z) => z.r),
  ...data.na.flatMap((r) => r.rows.flatMap((row) => row.r)),
].filter((x) => typeof x === "number");
console.log("corp zones:", data.corp.length);
console.log("corp villages/areas:", corpVillages.size, "talukas:", [...corpTalukas].join(", "));
console.log("corp survey tokens:", corpSurveyTokens);
console.log("corp fallback zones (f=1):", data.corp.filter((z) => z.f).length);
console.log("na villages:", data.na.length, "rows:", naRows, "survey tokens:", naSurveyTokens);
console.log("na talukas:", [...naTalukas].sort().join(", "));
console.log("rate range: ₹", Math.min(...allRates), "-", Math.max(...allRates), "per sq.m (ASR-2011)");
console.log("gamtal present:", data.na.filter((r) => r.gr || r.gc).length, "of", data.na.length);

// ---- write ----
const outDir = join(repo, "src", "lib", "jantri", "vadodara");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "corp.json"), JSON.stringify(data.corp));
writeFileSync(join(outDir, "na.json"), JSON.stringify(data.na));

const provDir = join(repo, "research", "jantri");
mkdirSync(provDir, { recursive: true });
copyFileSync(src, join(provDir, "vadodara-jantri-demo.html"));

console.log("\nwrote src/lib/jantri/vadodara/{corp,na}.json and research/jantri/vadodara-jantri-demo.html");
