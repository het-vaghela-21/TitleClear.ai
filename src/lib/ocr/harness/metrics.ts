import type { ExtractedFields } from "../types";

/** Standard Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prevDiag : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = temp;
    }
  }
  return dp[n];
}

/** Character error rate: edit distance / reference length (0 = perfect). */
export function characterErrorRate(recognized: string, reference: string): number {
  if (reference.length === 0) return recognized.length === 0 ? 0 : 1;
  return levenshtein(recognized, reference) / reference.length;
}

const GUJARATI_RE = /[઀-૿]/g;
const LATIN_RE = /[A-Za-z]/g;

/**
 * Approximate per-language CER: filters each string down to characters in
 * one script (Gujarati Unicode block vs. Latin letters) and runs CER on
 * those subsequences. This is not a true script-aware alignment — it's a
 * cheap proxy that's good enough to catch "Gujarati recognition is much
 * worse than English" regressions, which is what the harness is for.
 */
export function characterErrorRateByScript(
  recognized: string,
  reference: string,
): { en: number; gu: number } {
  const recGu = (recognized.match(GUJARATI_RE) ?? []).join("");
  const refGu = (reference.match(GUJARATI_RE) ?? []).join("");
  const recEn = (recognized.match(LATIN_RE) ?? []).join("");
  const refEn = (reference.match(LATIN_RE) ?? []).join("");
  return {
    en: characterErrorRate(recEn, refEn),
    gu: characterErrorRate(recGu, refGu),
  };
}

/** Fraction of ground-truth fields whose extracted value matches exactly. */
export function fieldAccuracy(
  extracted: ExtractedFields,
  groundTruth: ExtractedFields,
): { accuracy: number; total: number; correct: number } {
  const keys = Object.keys(groundTruth) as (keyof ExtractedFields)[];
  let correct = 0;
  for (const key of keys) {
    const gt = groundTruth[key];
    const ex = extracted[key];
    if (gt === undefined) continue;
    if (typeof gt === "number") {
      if (typeof ex === "number" && Math.abs(ex - gt) < 0.01) correct++;
    } else if (String(ex ?? "").trim() === String(gt).trim()) {
      correct++;
    }
  }
  return { accuracy: keys.length ? correct / keys.length : 1, total: keys.length, correct };
}
