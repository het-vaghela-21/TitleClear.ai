import { NextRequest, NextResponse } from "next/server";
import { getDistrictMeta, searchVillages } from "@/lib/jantri/registry";

/**
 * GET /api/jantri/villages?district=vadodara&q=<partial name>
 *
 * Village/area autocomplete for the jantri lookup. Returns up to 40 hits
 * as { village, taluka, book } — book tells the UI whether the hit comes
 * from the Corporation/Authority book or the NA (village) book.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = (searchParams.get("district") ?? "vadodara").toLowerCase();
  const q = searchParams.get("q") ?? "";

  if (!getDistrictMeta(district)) {
    return NextResponse.json({ error: `Unknown district: ${district}` }, { status: 404 });
  }

  return NextResponse.json({ villages: searchVillages(district, q) });
}
