"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/doc-filler/types";
import { loadUiLang, saveUiLang } from "@/lib/doc-filler/draft-store";

/**
 * UI language for the documents section (labels, helper text). Persisted in
 * localStorage. Starts as "en" on both server and first client render to
 * avoid a hydration mismatch, then flips to the stored choice after mount.
 */
export function useUiLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    // One-time sync with localStorage after mount — reading it during render
    // would mismatch the server HTML. Same pattern as the report store.
    const stored = loadUiLang();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setLang(stored);
  }, []);

  const update = (next: Lang) => {
    setLang(next);
    saveUiLang(next);
  };

  return [lang, update];
}
