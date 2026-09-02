import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getFieldExtractor, getOcrProvider, type OcrProviderId } from "../registry";
import type { ExtractedFields } from "../types";
import { characterErrorRateByScript, fieldAccuracy } from "./metrics";

interface Fixture {
  imagePath: string;
  groundTruth: { docType: string; fields: ExtractedFields; referenceText: string };
}

function loadFixtures(dir: string): Fixture[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const jsonPath = path.join(dir, f);
    const groundTruth = JSON.parse(readFileSync(jsonPath, "utf-8"));
    const imagePath = jsonPath.replace(/\.json$/, ".png");
    return { imagePath, groundTruth };
  });
}

interface HarnessResult {
  provider: string;
  docCount: number;
  cerEn: number;
  cerGu: number;
  fieldAccuracy: number;
  perDoc: Array<{ id: string; cerEn: number; cerGu: number; fieldAccuracy: number }>;
}

/**
 * Runs OCR + field extraction over the synthetic fixture set and reports
 * character error rate (per language) and field-level accuracy.
 */
export async function runHarness(fixturesDir: string, providerId: OcrProviderId): Promise<HarnessResult> {
  const fixtures = loadFixtures(fixturesDir);
  const ocrProvider = getOcrProvider(providerId);
  const extractor = getFieldExtractor("mock");

  const perDoc: HarnessResult["perDoc"] = [];
  for (const fixture of fixtures) {
    const ocr = await ocrProvider.extract(fixture.imagePath, ["en", "gu"]);
    const { en, gu } = characterErrorRateByScript(ocr.rawText, fixture.groundTruth.referenceText);
    const extraction = await extractor.extract(ocr);
    const { accuracy } = fieldAccuracy(extraction.fields, fixture.groundTruth.fields);

    perDoc.push({ id: path.basename(fixture.imagePath, ".png"), cerEn: en, cerGu: gu, fieldAccuracy: accuracy });
  }

  const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);

  return {
    provider: providerId,
    docCount: perDoc.length,
    cerEn: avg(perDoc.map((d) => d.cerEn)),
    cerGu: avg(perDoc.map((d) => d.cerGu)),
    fieldAccuracy: avg(perDoc.map((d) => d.fieldAccuracy)),
    perDoc,
  };
}

