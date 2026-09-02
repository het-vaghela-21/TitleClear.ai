import assert from "node:assert/strict";
import test from "node:test";
import { findInTokens, normalizeQuery, tokenMatch } from "./match";

/**
 * The survey-token matcher decides which jantri zone a user's survey number
 * lands in — real money decisions ride on it, so its semantics (ported from
 * the mentor's demo) are pinned here.
 *
 *   npm run test:jantri
 */

test("exact token match", () => {
  assert.equal(tokenMatch("1486", "1486"), "exact");
  assert.equal(tokenMatch("86/2", "86/2"), "exact");
  assert.equal(tokenMatch("1486", "1487"), null);
});

test("range tokens match numeric queries inside the range", () => {
  assert.equal(tokenMatch("12 TO 45", "12"), "exact");
  assert.equal(tokenMatch("12 TO 45", "30"), "exact");
  assert.equal(tokenMatch("12 TO 45", "45"), "exact");
  assert.equal(tokenMatch("12 TO 45", "46"), null);
  assert.equal(tokenMatch("12 TO 45", "11"), null);
  // Non-numeric queries never match a range.
  assert.equal(tokenMatch("12 TO 45", "12/2"), null);
});

test("subdivided listings are related to their base number", () => {
  assert.equal(tokenMatch("1674/PAIKI", "1674"), "related");
  assert.equal(tokenMatch("240/P", "240"), "related");
  assert.equal(tokenMatch("86/2", "86"), "related");
});

test("base listings are related to subdivided queries", () => {
  assert.equal(tokenMatch("86", "86/2"), "related");
  assert.equal(tokenMatch("1674", "1674/PAIKI"), "related");
});

test("prefix similarity alone is NOT a match", () => {
  assert.equal(tokenMatch("864", "86"), null);
  assert.equal(tokenMatch("86", "864"), null);
  assert.equal(tokenMatch("1486", "148"), null);
});

test("findInTokens buckets exacts and relateds", () => {
  const { exact, related } = findInTokens(["86/1", "86/2", "87", "12 TO 45"], "86");
  assert.deepEqual(exact, []);
  assert.deepEqual(related, ["86/1", "86/2"]);
  const r2 = findInTokens(["86/1", "86/2", "87", "12 TO 45"], "30");
  assert.deepEqual(r2.exact, ["12 TO 45"]);
  assert.deepEqual(r2.related, []);
});

test("normalizeQuery uppercases and collapses whitespace", () => {
  assert.equal(normalizeQuery("  1674 / paiki "), "1674 / PAIKI");
  assert.equal(normalizeQuery("akota\t "), "AKOTA");
});
