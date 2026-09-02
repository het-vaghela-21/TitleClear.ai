import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { MockLLMFieldExtractor } from "./extractor/llm-providers/mock-llm-provider";
import { characterErrorRate, characterErrorRateByScript, fieldAccuracy, levenshtein } from "./harness/metrics";
import { getFieldExtractor, getOcrProvider } from "./registry";
import { TesseractProvider } from "./providers/tesseract-provider";
import { NotImplementedProviderError, ProviderNotConfiguredError } from "./types";

test("levenshtein: identical strings", () => {
  assert.equal(levenshtein("hello", "hello"), 0);
});

test("levenshtein: single substitution", () => {
  assert.equal(levenshtein("cat", "bat"), 1);
});

test("characterErrorRate: perfect match is 0", () => {
  assert.equal(characterErrorRate("survey no 123", "survey no 123"), 0);
});

test("characterErrorRate: empty reference with output is 1", () => {
  assert.equal(characterErrorRate("x", ""), 1);
});

test("characterErrorRateByScript: separates gujarati and latin errors", () => {
  const reference = "Survey No : 100/1\nસર્વે નંબર";
  const recognized = "Survey No : 100/1\nસર્વે નંબર"; // exact match
  const { en, gu } = characterErrorRateByScript(recognized, reference);
  assert.equal(en, 0);
  assert.equal(gu, 0);
});

test("fieldAccuracy: all fields correct", () => {
  const gt = { surveyNo: "100/1", khataNo: "2000" };
  const { accuracy, correct, total } = fieldAccuracy(gt, gt);
  assert.equal(accuracy, 1);
  assert.equal(correct, 2);
  assert.equal(total, 2);
});

test("fieldAccuracy: partial match", () => {
  const gt = { surveyNo: "100/1", khataNo: "2000" };
  const extracted = { surveyNo: "100/1", khataNo: "9999" };
  const { accuracy } = fieldAccuracy(extracted, gt);
  assert.equal(accuracy, 0.5);
});

test("MockLLMFieldExtractor: extracts labeled fields from raw text", async () => {
  const extractor = new MockLLMFieldExtractor();
  const rawText = [
    "Document Type : 7/12 Extract",
    "Owner Name : Ramesh Patel",
    "Survey No : 100/1",
    "Khata No : 2000",
    "Village : Kalol",
    "District : Gandhinagar",
    "Area : 0.50 acre",
    "Date : 01-01-2015",
    "Transaction Type : Sale Deed",
  ].join("\n");

  const result = await extractor.extract({
    rawText,
    textBlocks: [],
    detectedLangs: ["en", "gu"],
    confidence: 0.9,
    provider: "fixture",
  });

  assert.equal(result.fields.docType, "7/12 Extract");
  assert.equal(result.fields.ownerName, "Ramesh Patel");
  assert.equal(result.fields.surveyNo, "100/1");
  assert.equal(result.fields.khataNo, "2000");
  assert.equal(result.fields.village, "Kalol");
  assert.equal(result.fields.district, "Gandhinagar");
  assert.equal(result.fields.areaValue, 0.5);
  assert.equal(result.fields.areaUnit, "acre");
  assert.equal(result.fields.transactionDate, "2015-01-01");
  assert.equal(result.fields.transactionType, "Sale Deed");
});

test("registry: getOcrProvider resolves tesseract explicitly", () => {
  const provider = getOcrProvider("tesseract");
  assert.equal(provider.id, "tesseract");
});

test("registry: getFieldExtractor defaults to mock (offline, deterministic)", () => {
  const extractor = getFieldExtractor();
  assert.equal(extractor.id, "mock");
});

test("registry: unknown provider throws", () => {
  assert.throws(() => getOcrProvider("bogus"));
});

test("stub providers throw NotImplementedProviderError", async () => {
  const surya = getOcrProvider("surya");
  await assert.rejects(() => surya.extract("nonexistent.png"), NotImplementedProviderError);
});

test("GoogleVisionProvider throws ProviderNotConfiguredError without an API key", async () => {
  const original = process.env.GOOGLE_VISION_API_KEY;
  delete process.env.GOOGLE_VISION_API_KEY;
  try {
    const provider = getOcrProvider("google");
    await assert.rejects(() => provider.extract("nonexistent.png"), ProviderNotConfiguredError);
  } finally {
    if (original) process.env.GOOGLE_VISION_API_KEY = original;
  }
});

// This test actually runs Tesseract OCR against a generated fixture, so it's
// slower and downloads traineddata on first run unless TESSERACT_LANG_PATH
// is set. Skipped when the fixture hasn't been generated yet
// (`npm run ocr:generate-fixtures`).
test("TesseractProvider: extracts text from a synthetic fixture", { timeout: 60_000 }, async (t) => {
  const fixture = path.join(__dirname, "fixtures", "synthetic", "synthetic-000.png");
  if (!existsSync(fixture)) {
    t.skip("fixture not generated — run `npm run ocr:generate-fixtures`");
    return;
  }

  const provider = new TesseractProvider();
  const result = await provider.extract(fixture, ["en", "gu"]);
  assert.ok(result.rawText.length > 0);
  assert.ok(result.rawText.includes("Survey") || result.rawText.includes("survey"));
});
