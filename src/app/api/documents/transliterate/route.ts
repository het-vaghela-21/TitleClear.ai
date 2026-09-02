import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/documents/transliterate?text=<latin word>
 *
 * Proxies Google Input Tools to turn Latin-typed words into Gujarati script
 * ("kem" → "કેમ"). Proxied server-side so the browser talks only to us and
 * the provider stays swappable. The form only calls this after the user
 * explicitly switches a field to "type in Gujarati" mode, and only with the
 * word being converted — never whole documents.
 */

const ENDPOINT = "https://inputtools.google.com/request";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = (searchParams.get("text") ?? "").trim();

  if (text === "" || text.length > 64) {
    return NextResponse.json({ suggestions: [] });
  }

  const url =
    `${ENDPOINT}?itc=gu-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8` +
    `&text=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const data: unknown = await res.json();
    // Shape: ["SUCCESS", [["kem", ["કેમ", ...], ...]]]
    if (Array.isArray(data) && data[0] === "SUCCESS") {
      const first = (data[1] as unknown[][])?.[0];
      const suggestions = Array.isArray(first?.[1]) ? (first[1] as string[]).slice(0, 5) : [];
      return NextResponse.json({ suggestions });
    }
  } catch {
    // Network hiccup / timeout — the form just keeps the Latin text.
  }
  return NextResponse.json({ suggestions: [] });
}
