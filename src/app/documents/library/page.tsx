"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Languages, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocKindIcon } from "@/components/documents/doc-kind-icon";
import { LangToggle } from "@/components/documents/lang-toggle";
import { UploadDrop } from "@/components/documents/upload-drop";
import { useUiLang } from "@/components/documents/use-ui-lang";
import { ltext, type Lang } from "@/lib/doc-filler/types";
import {
  KIND_LABELS,
  formatSize,
  isViewable,
  type StoredDoc,
} from "@/lib/doc-library/types";
import { Button } from "@/components/ui/button";

interface UploadError {
  name: string;
  reason: string;
}

function formatWhen(iso: string, lang: Lang): string {
  return new Date(iso).toLocaleString(lang === "gu" ? "gu-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DocumentLibraryPage() {
  const [uiLang, setUiLang] = useUiLang();
  // undefined while the first fetch is in flight, so the empty state doesn't
  // flash before we know whether the library is actually empty.
  const [docs, setDocs] = useState<StoredDoc[] | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/library");
      // The proxy only redirects when there is no cookie at all; a session
      // that expired or was revoked gets this far and lands here.
      if (res.status === 401) {
        // Hard navigation: the session is gone, so every cached route and the
        // mounted header must re-resolve as signed out.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?next=${encodeURIComponent("/documents/library")}`);
        return;
      }
      const data = await res.json();
      setDocs(data.docs ?? []);
    } catch {
      setDocs([]);
      setErrors([{ name: "", reason: "Could not load the library." }]);
    }
  }, []);

  useEffect(() => {
    // The library lives on the server, so this is a read from an external
    // store on mount, not derived state. The rule can't see that `refresh`
    // only calls setState after awaiting the fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function handleFiles(files: File[]) {
    setUploading(true);
    setErrors([]);
    try {
      const body = new FormData();
      for (const file of files) body.append("file", file);

      const res = await fetch("/api/documents/library", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setErrors([{ name: "", reason: data.error ?? "Upload failed." }]);
      } else if (data.errors?.length) {
        setErrors(data.errors);
      }
      await refresh();
    } catch {
      setErrors([{ name: "", reason: "Upload failed — the server did not respond." }]);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: StoredDoc) {
    const message =
      uiLang === "gu"
        ? `"${doc.name}" કાઢી નાખવી છે? આ પાછું લાવી શકાશે નહીં.`
        : `Delete "${doc.name}"? This cannot be undone.`;
    if (!window.confirm(message)) return;

    setDeletingId(doc.id);
    try {
      await fetch(`/api/documents/library/${doc.id}`, { method: "DELETE" });
      await refresh();
    } finally {
      setDeletingId(null);
    }
  }

  const other: Lang = uiLang === "gu" ? "en" : "gu";

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pt-10 pb-20">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {uiLang === "gu" ? "બધા દસ્તાવેજ" : "All documents"}
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">
                {uiLang === "gu" ? "મારા દસ્તાવેજ" : "My documents"}
              </p>
              <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
                {uiLang === "gu" ? "તમારી પોતાની ફાઈલો" : "Your own files"}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {uiLang === "gu"
                  ? "તમારા મિલકતના કાગળો — દસ્તાવેજ, ૭/૧૨ ઉતારો, બાનાખત, નકશા — અહીં રાખો. PDF, Word અને સ્કેન કરેલી ઈમેજ સીધી અહીં જ ખૂલે છે."
                  : "Keep your property papers — deeds, 7/12 extracts, banakhat, maps — in one place. PDFs, Word files and scans open right here."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-4" />
              <LangToggle value={uiLang} onChange={setUiLang} size="md" />
            </div>
          </div>

          <div className="mt-8">
            <UploadDrop uiLang={uiLang} busy={uploading} onFiles={handleFiles} />
          </div>

          {errors.length > 0 ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <TriangleAlert className="size-4" />
                {uiLang === "gu" ? "કેટલીક ફાઈલ અપલોડ ન થઈ" : "Some files were not uploaded"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {errors.map((err, i) => (
                  <li key={i}>
                    {err.name ? <span className="font-medium">{err.name}</span> : null}
                    {err.name ? " — " : null}
                    {err.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* List */}
          <div className="mt-10">
            {docs === undefined ? (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {uiLang === "gu" ? "લોડ થઈ રહ્યું છે…" : "Loading…"}
              </p>
            ) : docs.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
                <p className="font-serif text-lg font-medium">
                  {uiLang === "gu" ? "હજી કંઈ અપલોડ થયું નથી" : "Nothing uploaded yet"}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {uiLang === "gu"
                    ? "ઉપરના ખાનામાં ફાઈલ મૂકતાં જ તે અહીં યાદીમાં દેખાશે."
                    : "Add a file above and it will show up in this list."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-serif text-xl font-medium">
                    {uiLang === "gu" ? "અપલોડ કરેલી ફાઈલો" : "Uploaded files"}
                    <span className="ml-2 text-sm font-normal text-muted-foreground" lang={other}>
                      {docs.length}
                    </span>
                  </h2>
                </div>

                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                  {docs.map((doc) => {
                    const viewable = isViewable(doc);
                    return (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5"
                      >
                        <DocKindIcon kind={doc.kind} />

                        <div className="min-w-[12rem] flex-1">
                          <p className="text-sm font-medium break-all">{doc.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {ltext(KIND_LABELS[doc.kind], uiLang)} · {formatSize(doc.size)} ·{" "}
                            {formatWhen(doc.uploadedAt, uiLang)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {viewable ? (
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <Link href={`/documents/library/${doc.id}`}>
                                  <Eye />
                                  {uiLang === "gu" ? "જુઓ" : "View"}
                                </Link>
                              }
                              nativeButton={false}
                            />
                          ) : null}

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={uiLang === "gu" ? "ડાઉનલોડ" : "Download"}
                            render={
                              <a href={`/api/documents/library/${doc.id}?download=1`} download>
                                <Download />
                              </a>
                            }
                            nativeButton={false}
                          />

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={uiLang === "gu" ? "કાઢી નાખો" : "Delete"}
                            disabled={deletingId === doc.id}
                            onClick={() => handleDelete(doc)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            {deletingId === doc.id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <Trash2 />
                            )}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>

          <p className="mt-10 rounded-lg border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground">
            {uiLang === "gu"
              ? "આ ફાઈલો તમારા એકાઉન્ટ સાથે જોડાયેલી છે — બીજું કોઈ તે જોઈ શકતું નથી. આ સર્વર પર જ સચવાય છે, બહાર ક્યાંય મોકલાતી નથી. હાલ આ ડેમો સ્ટોરેજ છે અને બેકઅપ લેવાતું નથી, એટલે એકમાત્ર નકલ અહીં ન રાખો."
              : "These files belong to your account — nobody else can see them. They stay on this server and are not sent anywhere else. This is still demo storage with no backups, so don't keep your only copy here."}
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
