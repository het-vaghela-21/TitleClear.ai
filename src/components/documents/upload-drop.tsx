"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import type { Lang } from "@/lib/doc-filler/types";
import { MAX_UPLOAD_BYTES, formatSize } from "@/lib/doc-library/types";
import { cn } from "@/lib/utils";

/**
 * Drop area / file picker for the document library. Accepts anything — the
 * store keeps every file type; only the preview is selective.
 */
export function UploadDrop({
  uiLang,
  busy,
  onFiles,
}: {
  uiLang: Lang;
  busy: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // Nested dragenter/dragleave pairs fire for every child element, so count
  // them instead of toggling a boolean or the highlight flickers.
  const depth = useRef(0);

  function take(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFiles(files);
  }

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setDragging(false);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!busy) take(e.dataTransfer.files);
      }}
      className={cn(
        "rounded-lg border border-dashed transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/30",
      )}
    >
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 px-6 py-10 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        <span
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full",
            dragging ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground",
          )}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Upload className="size-5" />
          )}
        </span>

        <span className="text-sm font-medium">
          {busy
            ? uiLang === "gu"
              ? "અપલોડ થઈ રહ્યું છે…"
              : "Uploading…"
            : uiLang === "gu"
              ? "ફાઈલ અહીં ખેંચીને મૂકો, અથવા પસંદ કરવા ક્લિક કરો"
              : "Drop files here, or click to choose"}
        </span>

        <span className="max-w-md text-xs leading-relaxed text-muted-foreground">
          {uiLang === "gu"
            ? `PDF, Word (.doc / .docx), સ્કેન કરેલી ઈમેજ કે બીજી કોઈ પણ ફાઈલ. એક ફાઈલ વધુમાં વધુ ${formatSize(MAX_UPLOAD_BYTES)}.`
            : `PDF, Word (.doc / .docx), scanned images or any other file. Up to ${formatSize(MAX_UPLOAD_BYTES)} each.`}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          take(e.target.files);
          // Let the same file be picked again after a delete.
          e.target.value = "";
        }}
      />
    </div>
  );
}
