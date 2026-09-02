import type { FieldValues, Lang } from "./types";

/**
 * Drafts autosave to localStorage (unlike the report flow's sessionStorage —
 * a half-filled deed shouldn't vanish when the tab closes). One draft per
 * template slug; nothing leaves the browser.
 */
const DRAFT_PREFIX = "titleclear:doc-draft:";
const UI_LANG_KEY = "titleclear:doc-ui-lang";

export interface DocDraft {
  slug: string;
  values: FieldValues;
  docLang: Lang;
  updatedAt: string;
}

export function saveDraft(draft: DocDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_PREFIX + draft.slug, JSON.stringify(draft));
  } catch {
    // Storage full/blocked — autosave is best-effort.
  }
}

export function loadDraft(slug: string): DocDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DRAFT_PREFIX + slug);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DocDraft;
  } catch {
    return null;
  }
}

export function clearDraft(slug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_PREFIX + slug);
}

export function saveUiLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(UI_LANG_KEY, lang);
  } catch {
    // best-effort
  }
}

export function loadUiLang(): Lang | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(UI_LANG_KEY);
  return v === "gu" || v === "en" ? v : null;
}
