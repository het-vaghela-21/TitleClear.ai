import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { runHarness } from "@/lib/ocr/harness/run-harness";
import type { OcrProviderId } from "@/lib/ocr/registry";
import { ProviderNotConfiguredError } from "@/lib/ocr/types";

const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "ocr", "fixtures", "synthetic");

/**
 * GET /api/ocr-demo/harness?provider=tesseract
 *
 * Runs the OCR + extraction pipeline over the full synthetic fixture set
 * and returns aggregate + per-document CER and field-accuracy metrics.
 */
export async function GET(request: NextRequest) {
  const provider = (request.nextUrl.searchParams.get("provider") as OcrProviderId | null) ?? "tesseract";

  try {
    const result = await runHarness(FIXTURES_DIR, provider);
    return NextResponse.json(result);
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
