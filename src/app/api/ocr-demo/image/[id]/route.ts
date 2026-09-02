import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const FIXTURES_DIR = path.join(process.cwd(), "src", "lib", "ocr", "fixtures", "synthetic");
const VALID_ID = /^synthetic-\d{3}$/;

/** GET /api/ocr-demo/image/[id] — serves one synthetic demo document's PNG. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!VALID_ID.test(id)) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 });
  }

  try {
    const bytes = readFileSync(path.join(FIXTURES_DIR, `${id}.png`));
    return new NextResponse(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Fixture image not found" }, { status: 404 });
  }
}
