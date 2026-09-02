"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocKindIcon } from "@/components/documents/doc-kind-icon";
import { useUiLang } from "@/components/documents/use-ui-lang";
import { Button } from "@/components/ui/button";
import { ltext } from "@/lib/doc-filler/types";
import { KIND_LABELS, formatSize, type StoredDoc, type ViewMode } from "@/lib/doc-library/types";

interface ViewPayload {
  doc: StoredDoc;
  mode: ViewMode;
  html?: string;
  text?: string;
  truncated?: boolean;
  warnings?: string[];
  error?: string;
}

/**
 * Wraps mammoth's HTML in a minimal, self-contained page for the sandboxed
 * iframe. The sheet stays white with dark ink whatever the app theme is —
 * it stands in for a printed document, same as the draft preview.
 *
 * Fonts are system faces: the iframe has an opaque origin, so it cannot
 * reuse the next/font faces loaded by the parent document.
 */
function sheetSrcDoc(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
  :root { color-scheme: light; }
  body {
    margin: 0; padding: 40px 48px; background: #fff; color: #1b2430;
    font-family: "Noto Sans Gujarati", "Nirmala UI", "Shruti", system-ui, sans-serif;
    font-size: 15px; line-height: 1.75; overflow-wrap: break-word;
  }
  p { margin: 0 0 0.9em; }
  h1, h2, h3, h4 { font-weight: 600; line-height: 1.35; margin: 1.4em 0 0.5em; }
  h1 { font-size: 1.5em; } h2 { font-size: 1.25em; } h3 { font-size: 1.1em; }
  ul, ol { margin: 0 0 0.9em; padding-left: 1.4em; }
  img { max-width: 100%; height: auto; }
  table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
  td, th { border: 1px solid #ddd9cf; padding: 7px 10px; vertical-align: top; text-align: left; }
  a { color: #1f4e79; }
</style></head><body>${html}</body></html>`;
}

export default function DocumentViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [uiLang] = useUiLang();
  const [payload, setPayload] = useState<ViewPayload | null | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/library/${params.id}/view`);
      if (res.status === 401) {
        // Session expired or revoked — the proxy can't tell, only the API
        // can. Hard navigation so nothing keeps rendering as signed in.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          `/login?next=${encodeURIComponent(`/documents/library/${params.id}`)}`,
        );
        return;
      }
      if (!res.ok) {
        setPayload(null);
        return;
      }
      setPayload(await res.json());
    } catch {
      setPayload(null);
    }
  }, [params.id]);

  useEffect(() => {
    // Read from the server-side store on mount — same pattern as the
    // library list; setState only happens after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleDelete() {
    if (!payload) return;
    const message =
      uiLang === "gu"
        ? `"${payload.doc.name}" કાઢી નાખવી છે? આ પાછું લાવી શકાશે નહીં.`
        : `Delete "${payload.doc.name}"? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setDeleting(true);
    try {
      await fetch(`/api/documents/library/${params.id}`, { method: "DELETE" });
      router.push("/documents/library");
    } finally {
      setDeleting(false);
    }
  }

  if (payload === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <p className="mx-auto flex max-w-5xl items-center gap-2 px-6 py-20 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {uiLang === "gu" ? "ખૂલી રહ્યું છે…" : "Opening…"}
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (payload === null) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <section className="mx-auto max-w-lg px-6 py-20 text-center">
            <h1 className="font-serif text-2xl font-medium">
              {uiLang === "gu" ? "ફાઈલ મળી નહીં" : "File not found"}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {uiLang === "gu"
                ? "આ ફાઈલ કાઢી નાખવામાં આવી છે અથવા લિંક ખોટી છે."
                : "This file has been deleted, or the link is wrong."}
            </p>
            <Button
              className="mt-6"
              render={<Link href="/documents/library">{uiLang === "gu" ? "મારા દસ્તાવેજ" : "My documents"}</Link>}
              nativeButton={false}
            />
          </section>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { doc, mode } = payload;
  const rawUrl = `/api/documents/library/${doc.id}`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-10 pb-16">
          <Link
            href="/documents/library"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {uiLang === "gu" ? "મારા દસ્તાવેજ" : "My documents"}
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <DocKindIcon kind={doc.kind} />
              <div className="min-w-0">
                <h1 className="font-serif text-xl font-medium break-all sm:text-2xl">
                  {doc.name}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ltext(KIND_LABELS[doc.kind], uiLang)} · {formatSize(doc.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                render={
                  <a href={`${rawUrl}?download=1`} download>
                    <Download />
                    {uiLang === "gu" ? "ડાઉનલોડ" : "Download"}
                  </a>
                }
                nativeButton={false}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={uiLang === "gu" ? "કાઢી નાખો" : "Delete"}
                disabled={deleting}
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive"
              >
                {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </div>
          </div>

          {payload.warnings?.length ? (
            <p className="mt-6 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {uiLang === "gu"
                ? "આ પૂર્વાવલોકન છે — Word ફાઈલની કેટલીક ગોઠવણી (ફોન્ટ, માર્જિન, હેડર) અહીં એવી ને એવી નહીં દેખાય. મૂળ ફાઈલ માટે ડાઉનલોડ કરો."
                : "This is a preview — some of the Word file's formatting (fonts, margins, headers) will not appear exactly as in the original. Download it for the real thing."}
            </p>
          ) : null}

          <div className="mt-6">
            {mode === "pdf" ? (
              <iframe
                src={rawUrl}
                title={doc.name}
                className="h-[78vh] min-h-[520px] w-full rounded-lg border border-border bg-card"
              />
            ) : mode === "image" ? (
              <div className="flex justify-center rounded-lg border border-border bg-muted p-4">
                {/* A stored upload of unknown dimensions — next/image needs a
                    known size or a configured loader, so a plain img is right. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rawUrl}
                  alt={doc.name}
                  className="max-h-[78vh] w-auto max-w-full rounded-sm object-contain"
                />
              </div>
            ) : mode === "html" ? (
              <iframe
                // sandbox="" — no scripts, no forms, opaque origin. Even a
                // hostile .docx can do nothing from in here.
                sandbox=""
                srcDoc={sheetSrcDoc(payload.html ?? "")}
                title={doc.name}
                className="h-[78vh] min-h-[520px] w-full rounded-lg border border-border bg-white"
              />
            ) : mode === "text" ? (
              <div className="overflow-auto rounded-lg border border-border bg-card">
                <pre className="max-h-[78vh] p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {payload.text}
                </pre>
                {payload.truncated ? (
                  <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                    {uiLang === "gu"
                      ? "ફાઈલ મોટી હોવાથી પૂર્વાવલોકન કાપવામાં આવ્યું છે — આખું જોવા ડાઉનલોડ કરો."
                      : "The file is large, so this preview is cut short — download it to see all of it."}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card px-6 py-14 text-center">
                <TriangleAlert className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-4 font-serif text-lg font-medium">
                  {uiLang === "gu" ? "આ ફાઈલ અહીં ખોલી શકાતી નથી" : "This file can't be shown here"}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {payload.error ??
                    (uiLang === "gu"
                      ? `.${doc.ext} ફાઈલનું પૂર્વાવલોકન બ્રાઉઝરમાં શક્ય નથી. ડાઉનલોડ કરીને તમારા કમ્પ્યુટરના પ્રોગ્રામમાં ખોલો.`
                      : `A .${doc.ext} file can't be previewed in the browser. Download it and open it in the app on your computer.`)}
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  render={
                    <a href={`${rawUrl}?download=1`} download>
                      <Download />
                      {uiLang === "gu" ? "ડાઉનલોડ" : "Download"}
                    </a>
                  }
                  nativeButton={false}
                />
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
