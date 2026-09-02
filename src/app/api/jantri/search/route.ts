import { NextRequest, NextResponse } from "next/server";
import { getDistrictMeta, lookup } from "@/lib/jantri/registry";
import type { JantriSearchResponse } from "@/lib/jantri/types";

/**
 * GET /api/jantri/search?district=vadodara&village=AKOTA[&taluka=VADODARA CITY][&survey=86/2]
 *
 * Jantri rate lookup. Returns renderable result cards (Corporation-book
 * value zones and/or the NA-book entry for the village) plus the meta the
 * UI must show beside rates (multiplier provenance). The dataset itself
 * never leaves the server.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = (searchParams.get("district") ?? "vadodara").toLowerCase();
  const village = (searchParams.get("village") ?? "").trim();
  const taluka = searchParams.get("taluka")?.trim() || undefined;
  const survey = searchParams.get("survey")?.trim() || undefined;

  const meta = getDistrictMeta(district);
  if (!meta) {
    return NextResponse.json({ error: `Unknown district: ${district}` }, { status: 404 });
  }
  if (village.length < 2) {
    return NextResponse.json(
      { error: "Pass ?village= with at least 2 characters" },
      { status: 400 },
    );
  }

  const results = lookup(district, { village, taluka, survey });

  const body: JantriSearchResponse = {
    district,
    results,
    meta: {
      multiplierNote: meta.multiplierNote,
      asOfNote: meta.asOfNote,
      factsVerifiedOn: meta.factsVerifiedOn,
    },
  };
  return NextResponse.json(body);
}
