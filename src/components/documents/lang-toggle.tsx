"use client";

import type { Lang } from "@/lib/doc-filler/types";
import { cn } from "@/lib/utils";

/** Segmented EN / ગુજરાતી switch used for both UI language and document language. */
export function LangToggle({
  value,
  onChange,
  labels = { en: "English", gu: "ગુજરાતી" },
  size = "sm",
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  labels?: Record<Lang, string>;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex rounded-lg border border-input p-0.5">
      {(["gu", "en"] as Lang[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            "rounded-md font-medium transition-colors",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {labels[lang]}
        </button>
      ))}
    </div>
  );
}
