import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "ocr", "fixtures", "synthetic");

/**
 * GET /api/ocr-demo/fixtures
 *
 * Lists the synthetic demo documents (id, doc type, ground-truth fields,
 * reference text) for the OCR demo page. Synthetic-only, per
 * PROJECT_CONTEXT.md's OCR trial exception — no real documents involved.
 */
export async function GET() {
  let files: string[];
  try {
    files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return NextResponse.json(
      {
        error:
          "No synthetic fixtures found. Run `npm run ocr:generate-fixtures -- src/lib/ocr/fixtures/synthetic 8` first.",
      },
      { status: 404 },
    );
  }

  const fixtures = files
    .map((f) => JSON.parse(readFileSync(path.join(FIXTURES_DIR, f), "utf-8")))
    .sort((a, b) => a.id.localeCompare(b.id));

  return NextResponse.json({ fixtures });
}
