import { NextRequest, NextResponse } from "next/server";
import { currentUser, unauthorized } from "@/lib/auth/session";
import { listDocs, saveDoc } from "@/lib/doc-library/store";
import { MAX_UPLOAD_BYTES, formatSize } from "@/lib/doc-library/types";

/**
 * The signed-in account's document library.
 *
 *   GET  /api/documents/library   → { docs }        this account's files, newest first
 *   POST /api/documents/library   → { docs, errors } multipart upload, field "file"
 *
 * Both require a session and are scoped to it — the account id comes from the
 * session cookie, never from the request body or a query parameter, so there
 * is nothing for a caller to change in order to read someone else's files.
 *
 * A route handler rather than a server action because actions cap the request
 * body at 1 MB; handlers read the raw Web Request, so the only limit is the
 * one we set (MAX_UPLOAD_BYTES).
 */

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();

  return NextResponse.json({ docs: await listDocs(user.id) });
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected a multipart form upload." },
      { status: 400 },
    );
  }

  const files = form.getAll("file").filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No files in the request — send them as the "file" field.' },
      { status: 400 },
    );
  }

  // One bad file shouldn't sink the rest of a multi-file drop, so each is
  // reported individually and the response is 200 with an errors list.
  const docs = [];
  const errors: { name: string; reason: string }[] = [];

  for (const file of files) {
    try {
      const doc = await saveDoc(user.id, file);
      if (doc) {
        docs.push(doc);
      } else {
        errors.push({
          name: file.name,
          reason:
            file.size === 0
              ? "File is empty."
              : `Larger than the ${formatSize(MAX_UPLOAD_BYTES)} limit.`,
        });
      }
    } catch {
      errors.push({ name: file.name, reason: "Could not be saved." });
    }
  }

  return NextResponse.json({ docs, errors });
}
