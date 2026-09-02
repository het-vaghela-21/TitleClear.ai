/**
 * Document library — the user's own uploaded files (PDFs, Word files,
 * scans, anything else), kept beside the generated drafts under
 * `/documents`.
 *
 * Nothing in this file touches the filesystem, so client components can
 * import it for icons, labels and the viewer switch. The server-side store
 * lives in `store.ts` and is `server-only`.
 */

import type { LText } from "@/lib/doc-filler/types";

/** Broad family a file belongs to — drives the icon, label and viewer. */
export type DocKind = "pdf" | "word" | "image" | "text" | "other";

/** One uploaded file, as stored in its `<id>.meta.json` sidecar. */
export interface StoredDoc {
  id: string;
  /** Account this belongs to. Documents are never shared between accounts. */
  ownerId: string;
  /** Original filename as uploaded, sanitized for display. */
  name: string;
  /** Lowercase extension without the dot, e.g. "pdf". "bin" when unknown. */
  ext: string;
  /** Size in bytes. */
  size: number;
  kind: DocKind;
  /** ISO timestamp. */
  uploadedAt: string;
}

/* ------------------------------------------------------------------ */
/* Kinds                                                               */
/* ------------------------------------------------------------------ */

/**
 * Extension → kind. Anything not listed is "other": it still uploads and
 * downloads, it just has no inline preview.
 *
 * `svg` is deliberately absent — an SVG is a script-bearing document, so it
 * is treated as "other" and only ever handed back as a download. See
 * `contentTypeFor()`.
 */
const EXT_KINDS: Record<string, DocKind> = {
  pdf: "pdf",

  doc: "word",
  docx: "word",
  rtf: "word",
  odt: "word",

  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  tif: "image",
  tiff: "image",

  txt: "text",
  md: "text",
  csv: "text",
  json: "text",
  log: "text",
  xml: "text",
};

export function kindForExt(ext: string): DocKind {
  return EXT_KINDS[ext] ?? "other";
}

export const KIND_LABELS: Record<DocKind, LText> = {
  pdf: { gu: "PDF", en: "PDF" },
  word: { gu: "Word", en: "Word" },
  image: { gu: "ઈમેજ / સ્કેન", en: "Image / scan" },
  text: { gu: "ટેક્સ્ટ", en: "Text" },
  other: { gu: "અન્ય ફાઈલ", en: "Other file" },
};

/* ------------------------------------------------------------------ */
/* Viewer                                                              */
/* ------------------------------------------------------------------ */

/** How the viewer should render a document. "none" = download only. */
export type ViewMode = "pdf" | "image" | "html" | "text" | "none";

export function viewMode(doc: StoredDoc): ViewMode {
  switch (doc.kind) {
    case "pdf":
      return "pdf";
    case "image":
      return "image";
    case "text":
      return "text";
    case "word":
      // Only the modern zipped format can be converted to HTML. .doc (Word
      // 97 binary), .rtf and .odt download instead.
      return doc.ext === "docx" ? "html" : "none";
    default:
      return "none";
  }
}

export function isViewable(doc: StoredDoc): boolean {
  return viewMode(doc) !== "none";
}

/* ------------------------------------------------------------------ */
/* Serving                                                             */
/* ------------------------------------------------------------------ */

/**
 * What to send a stored file back as. The browser is never told to trust an
 * uploaded file's own claim about its type: the content type is derived from
 * the extension we sanitized at upload, and anything not on the inline
 * allow-list is forced to a download so an uploaded .html or .svg can never
 * run script on this origin.
 */
const INLINE_TYPES: Record<string, string> = {
  pdf: "application/pdf",

  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",

  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  csv: "text/plain; charset=utf-8",
  json: "text/plain; charset=utf-8",
  log: "text/plain; charset=utf-8",
  xml: "text/plain; charset=utf-8",
};

export function contentTypeFor(ext: string): { type: string; inline: boolean } {
  const inline = INLINE_TYPES[ext];
  return inline
    ? { type: inline, inline: true }
    : { type: "application/octet-stream", inline: false };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Largest file the upload route accepts, in bytes. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
