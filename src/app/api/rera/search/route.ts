import { NextRequest, NextResponse } from "next/server";
import { gujReraConnector } from "@/lib/connectors/gujrera";
import { ManualHandlingRequiredError } from "@/lib/connectors/registry";

/**
 * GET /api/rera/search?project=<name> | ?promoter=<name> | ?regNo=<no>
 *
 * Trial-only integration point for the GujRERA connector. Off by default —
 * gated by RERA_CONNECTOR_ENABLED, per PROJECT_CONTEXT.md's trial exception.
 */
export async function GET(request: NextRequest) {
  if (process.env.RERA_CONNECTOR_ENABLED !== "true") {
    return NextResponse.json(
      { error: "RERA connector is disabled (trial feature, off by default)." },
      { status: 501 },
    );
  }

  const { searchParams } = new URL(request.url);
  const projectName = searchParams.get("project") ?? undefined;
  const promoterName = searchParams.get("promoter") ?? undefined;
  const reraRegNo = searchParams.get("regNo") ?? undefined;

  if (!projectName && !promoterName && !reraRegNo) {
    return NextResponse.json(
      { error: "Pass one of ?project=, ?promoter=, or ?regNo=" },
      { status: 400 },
    );
  }

  try {
    const records = await gujReraConnector.fetch({ projectName, promoterName, reraRegNo });
    return NextResponse.json({ records });
  } catch (err) {
    if (err instanceof ManualHandlingRequiredError) {
      return NextResponse.json({ error: err.message, needsManualHandling: true }, { status: 502 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
