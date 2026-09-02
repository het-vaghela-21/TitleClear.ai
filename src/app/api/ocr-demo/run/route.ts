import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { characterErrorRateByScript, fieldAccuracy } from "@/lib/ocr/harness/metrics";
import { getFieldExtractor, getOcrProvider, type OcrProviderId } from "@/lib/ocr/registry";
import { ProviderNotConfiguredError } from "@/lib/ocr/types";

const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "ocr", "fixtures", "synthetic");
const VALID_ID = /^synthetic-\d{3}$/;

/**
 * POST /api/ocr-demo/run  { id, provider }
 *
 * Runs the real OCR + field-extraction pipeline against one synthetic demo
 * document and scores it against that document's ground truth. Synthetic
 * data only, per PROJECT_CONTEXT.md's OCR trial exception.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;
  const provider = (body?.provider as OcrProviderId | undefined) ?? "tesseract";

  if (!id || !VALID_ID.test(id)) {
    return NextResponse.json({ error: "Invalid or missing fixture id" }, { status: 400 });
  }

  const jsonPath = path.join(FIXTURES_DIR, `${id}.json`);
  let groundTruth: { docType: string; fields: Record<string, unknown>; referenceText: string };
  try {
    groundTruth = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch {
    return NextResponse.json({ error: "Fixture not found" }, { status: 404 });
  }

  try {
    const ocrProvider = getOcrProvider(provider);
    const imagePath = path.join(FIXTURES_DIR, `${id}.png`);
    const ocr = await ocrProvider.extract(imagePath, ["en", "gu"]);

    const extractor = getFieldExtractor();
    const extraction = await extractor.extract(ocr);

    const cer = characterErrorRateByScript(ocr.rawText, groundTruth.referenceText);
    const scored = fieldAccuracy(extraction.fields, groundTruth.fields);

    const fieldComparison = Object.entries(groundTruth.fields).map(([key, expected]) => {
      const actual = (extraction.fields as Record<string, unknown>)[key];
      const correct =
        typeof expected === "number"
          ? typeof actual === "number" && Math.abs(actual - expected) < 0.01
          : String(actual ?? "").trim() === String(expected).trim();
      return { field: key, expected, actual: actual ?? null, correct };
    });

    return NextResponse.json({
      provider: ocrProvider.id,
      ocr: { rawText: ocr.rawText, confidence: ocr.confidence, detectedLangs: ocr.detectedLangs },
      extraction: extraction.fields,
      fieldComparison,
      metrics: { cerEn: cer.en, cerGu: cer.gu, fieldAccuracy: scored.accuracy, correct: scored.correct, total: scored.total },
    });
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      return NextResponse.json({ error: err.message, needsConfig: true }, { status: 501 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
