import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { characterErrorRateByScript, fieldAccuracy } from "@/lib/ocr/harness/metrics";
import { getFieldExtractor, getOcrProvider, type OcrProviderId } from "@/lib/ocr/registry";
import { NotImplementedProviderError, ProviderNotConfiguredError } from "@/lib/ocr/types";

const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "ocr", "fixtures", "synthetic");
const VALID_ID = /^synthetic-\d{3}$/;

const ALL_PROVIDERS: OcrProviderId[] = ["tesseract", "google", "surya", "vlm"];

/**
 * POST /api/ocr-demo/compare  { id }
 *
 * Runs the same synthetic document through every registered OCR provider
 * (real, feature-flagged, or stubbed) and reports each one's outcome —
 * success with metrics, "not configured" (missing credentials), "not
 * implemented" (documented stub), or a genuine error. Nothing here is
 * hardcoded per-provider; each result comes from actually invoking that
 * provider's `extract()`.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id = body?.id as string | undefined;

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

  const imagePath = path.join(FIXTURES_DIR, `${id}.png`);
  const extractor = getFieldExtractor();

  const results = await Promise.all(
    ALL_PROVIDERS.map(async (providerId) => {
      const started = Date.now();
      try {
        const provider = getOcrProvider(providerId);
        const ocr = await provider.extract(imagePath, ["en", "gu"]);
        const extraction = await extractor.extract(ocr);
        const cer = characterErrorRateByScript(ocr.rawText, groundTruth.referenceText);
        const scored = fieldAccuracy(extraction.fields, groundTruth.fields);

        return {
          provider: providerId,
          displayName: provider.displayName,
          status: "ok" as const,
          latencyMs: Date.now() - started,
          confidence: ocr.confidence,
          rawText: ocr.rawText,
          cerEn: cer.en,
          cerGu: cer.gu,
          fieldAccuracy: scored.accuracy,
        };
      } catch (err) {
        const status =
          err instanceof ProviderNotConfiguredError
            ? ("not_configured" as const)
            : err instanceof NotImplementedProviderError
              ? ("not_implemented" as const)
              : ("error" as const);
        return {
          provider: providerId,
          displayName: getOcrProvider(providerId).displayName,
          status,
          latencyMs: Date.now() - started,
          message: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  return NextResponse.json({ id, results });
}
