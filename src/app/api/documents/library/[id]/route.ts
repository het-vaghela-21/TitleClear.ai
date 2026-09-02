import { NextRequest, NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth/session";
import { deleteDoc, getDoc, readDocBytes } from "@/lib/doc-library/store";
import { contentTypeFor } from "@/lib/doc-library/types";

/**
 * One stored document.
 *
 *   GET    /api/documents/library/[id]              → the bytes, for the viewer
 *   GET    /api/documents/library/[id]?download=1   → the bytes, as a download
 *   DELETE /api/documents/library/[id]              → removes it
 *
 * Both require a session, and the account id comes from that session — so
 * `getDoc` can only ever look inside the caller's own directory. Another
 * account's document id is simply not found; there is no id to guess your way
 * into.
 *
 * The response never echoes back the browser's own claim about the file
 * type. `contentTypeFor` maps the extension we sanitized at upload onto a
 * short allow-list of types safe to render inline; everything else — an
 * uploaded .html or .svg included — comes back as an octet-stream
 * attachment, so nothing a user uploads can run script on this origin.
 */

/** RFC 6266: ASCII fallback plus a UTF-8 form, so Gujarati names survive. */
function contentDisposition(inline: boolean, name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return (
    `${inline ? "inline" : "attachment"}; ` +
    `filename="${ascii}"; ` +
    `filename*=UTF-8''${encodeURIComponent(name)}`
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const doc = await getDoc(user.id, id);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const bytes = await readDocBytes(doc);
  if (!bytes) {
    return NextResponse.json({ error: "File is missing from the store" }, { status: 404 });
  }

  const { type, inline } = contentTypeFor(doc.ext);
  const asDownload = request.nextUrl.searchParams.get("download") === "1";
  const serveInline = inline && !asDownload;

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Content-Length": String(bytes.byteLength),
    "Content-Disposition": contentDisposition(serveInline, doc.name),
    // Never let the browser sniff past the type we chose.
    "X-Content-Type-Options": "nosniff",
    // Private to this user's library — proxies must not keep a copy.
    "Cache-Control": "private, max-age=0, no-store",
  };

  // Images and text get an opaque, script-free origin, so even a direct
  // visit to this URL can't touch the app. PDFs are exempt: the `sandbox`
  // directive stops Chrome's built-in viewer from loading and the file
  // just downloads instead. A PDF is safe inline regardless — the browser's
  // viewer already isolates any script it carries from the embedding page.
  if (type !== "application/pdf") {
    headers["Content-Security-Policy"] =
      "sandbox; default-src 'none'; style-src 'unsafe-inline'";
  }

  return new NextResponse(new Uint8Array(bytes), { headers });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!(await deleteDoc(user.id, id))) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
