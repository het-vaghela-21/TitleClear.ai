"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Text input with optional "type in Gujarati" assist: with assist on, each
 * Latin word is transliterated to Gujarati script when the user hits
 * space / enter / leaves the field ("kem cho" → "કેમ છો"). Conversion calls
 * our /api/documents/transliterate proxy one word at a time, and only while
 * the user has the toggle on. If the service is unreachable the text simply
 * stays as typed.
 */
export function GujaratiField({
  id,
  value,
  onChange,
  assist,
  onAssistChange,
  multiline = false,
  placeholder,
  rows = 3,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  assist: boolean;
  onAssistChange: (assist: boolean) => void;
  multiline?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  // Epoch guards against stale async replacements: any manual edit bumps it,
  // and a conversion only lands if the epoch is unchanged since it started.
  const epochRef = useRef(0);
  const elRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      epochRef.current += 1;
    };
  }, []);

  async function transliterate(word: string): Promise<string | null> {
    try {
      const res = await fetch(
        `/api/documents/transliterate?text=${encodeURIComponent(word)}`,
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { suggestions?: string[] };
      return data.suggestions?.[0] ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Convert the Latin word that ends at `caret`, then re-insert `suffix`
   * ("" on blur, " " for space, "\n" for enter in a textarea).
   */
  async function convertAt(caret: number, suffix: string) {
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const match = /([A-Za-z]{1,64})$/.exec(before);
    if (!match) {
      if (suffix) applyValue(before + suffix + after, caret + suffix.length);
      return;
    }
    const word = match[1];
    const wordStart = caret - word.length;
    const epoch = ++epochRef.current;
    setBusy(true);
    const converted = await transliterate(word);
    setBusy(false);
    if (epochRef.current !== epoch) return; // user kept editing — drop it
    const replacement = converted ?? word;
    const next = before.slice(0, wordStart) + replacement + suffix + after;
    applyValue(next, wordStart + replacement.length + suffix.length);
  }

  function applyValue(next: string, caret: number) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = elRef.current;
      if (el && document.activeElement === el) {
        el.setSelectionRange(caret, caret);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!assist) return;
    const isSpace = e.key === " ";
    const isEnter = e.key === "Enter";
    if (!isSpace && !isEnter) return;
    if (isEnter && !multiline) {
      // Let form-level enter behavior happen, but convert the trailing word.
      void convertAt(e.currentTarget.selectionStart ?? value.length, "");
      return;
    }
    if (isSpace || (isEnter && multiline)) {
      e.preventDefault();
      void convertAt(
        e.currentTarget.selectionStart ?? value.length,
        isSpace ? " " : "\n",
      );
    }
  }

  function handleBlur() {
    if (!assist) return;
    void convertAt(elRef.current?.selectionStart ?? value.length, "");
  }

  const toggle = (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onAssistChange(!assist)}
      title={
        assist
          ? "Gujarati typing on — English words convert to ગુજરાતી as you type (uses Google Input Tools). Click to type plain English."
          : "Type in English letters and convert to ગુજરાતી automatically (uses Google Input Tools)."
      }
      className={cn(
        "absolute right-1.5 top-1.5 z-10 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors",
        assist
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {busy ? "…" : "ગુ"}
    </button>
  );

  if (multiline) {
    return (
      <div className="relative">
        {toggle}
        <textarea
          id={id}
          ref={(el) => {
            elRef.current = el;
          }}
          value={value}
          rows={rows}
          lang={assist ? "gu" : undefined}
          placeholder={placeholder}
          onChange={(e) => {
            epochRef.current += 1;
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 pr-10 text-base transition-colors outline-none",
            "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
            className,
          )}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {toggle}
      <Input
        id={id}
        ref={(el) => {
          elRef.current = el;
        }}
        value={value}
        lang={assist ? "gu" : undefined}
        placeholder={placeholder}
        onChange={(e) => {
          epochRef.current += 1;
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn("pr-10", className)}
      />
    </div>
  );
}
