/**
 * Helpers templates use inside `build()`: a value-accessor context with
 * blank-filling (unfilled fields render as "________" so a half-complete
 * preview still reads like a real deed form), plus terse block constructors.
 */

import type { DocBlock, FieldValues, GroupEntry, Lang, Run } from "./types";
import { BLANK, orBlank } from "./types";
import {
  agePhrase,
  dateLong,
  dateShort,
  rupeesInWords,
  toGujaratiDigits,
} from "./gujarati";

export interface Ctx {
  lang: Lang;
  /** Raw value or "" (never blanks). */
  raw(id: string): string;
  /** Value or a blank line. */
  t(id: string, blank?: string): string;
  /** Numeric-ish value; Gujarati digits when lang is gu. */
  num(id: string): string;
  /** Deed-style rupee phrase: figures + words. */
  money(id: string): string;
  /** "તા. ૧૮/૦૮/૨૦૨૬" / "18/08/2026". */
  date(id: string): string;
  /** "તા. ૧૮મી ઓગસ્ટ, ૨૦૨૬ ને સોમવાર" / "18th August, 2026 (Monday)". */
  dateLong(id: string): string;
  /** "ઉ.વ. આશરે ૪૫" / "aged about 45 years". */
  age(id: string): string;
  /** Entries of a repeating group; empty array if none. */
  group(id: string): GroupCtx[];
  /** True when the field has a non-empty value. */
  has(id: string): boolean;
}

export interface GroupCtx {
  index: number;
  raw(id: string): string;
  t(id: string, blank?: string): string;
  num(id: string): string;
  age(id: string): string;
  has(id: string): boolean;
}

function numText(value: string, lang: Lang): string {
  const v = value.trim();
  if (v === "") return BLANK;
  return lang === "gu" ? toGujaratiDigits(v) : v;
}

export function makeCtx(values: FieldValues, lang: Lang): Ctx {
  const str = (id: string): string => {
    const v = values[id];
    return typeof v === "string" ? v : "";
  };
  return {
    lang,
    raw: (id) => str(id).trim(),
    t: (id, blank = BLANK) => orBlank(str(id), blank),
    num: (id) => numText(str(id), lang),
    money: (id) => rupeesInWords(str(id), lang),
    date: (id) => dateShort(str(id) || undefined, lang),
    dateLong: (id) => dateLong(str(id) || undefined, lang),
    age: (id) => agePhrase(str(id) || undefined, lang),
    has: (id) => str(id).trim() !== "",
    group: (id) => {
      const v = values[id];
      const entries: GroupEntry[] = Array.isArray(v) ? v : [];
      return entries.map((entry, index) => {
        const gstr = (fid: string) => (typeof entry[fid] === "string" ? entry[fid] : "");
        return {
          index,
          raw: (fid) => gstr(fid).trim(),
          t: (fid, blank = BLANK) => orBlank(gstr(fid), blank),
          num: (fid) => numText(gstr(fid), lang),
          age: (fid) => agePhrase(gstr(fid) || undefined, lang),
          has: (fid) => gstr(fid).trim() !== "",
        };
      });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Block constructors                                                  */
/* ------------------------------------------------------------------ */

export function title(text: string): DocBlock {
  return { type: "title", text };
}

export function subtitle(text: string): DocBlock {
  return { type: "subtitle", text };
}

/** Paragraph from strings/runs; strings become plain runs. */
export function para(parts: Array<string | Run>, align?: "left" | "center" | "justify" | "right"): DocBlock {
  return { type: "para", runs: toRuns(parts), align };
}

export function clause(no: string, parts: Array<string | Run>): DocBlock {
  return { type: "clause", no, runs: toRuns(parts) };
}

export function schedule(rows: { label: string; value: string }[], caption?: string): DocBlock {
  return { type: "schedule", rows, caption };
}

export function signatures(parties: { role: string; name: string }[]): DocBlock {
  return { type: "signatures", parties };
}

export function witnesses(heading: string, names: string[]): DocBlock {
  return { type: "witnesses", heading, names };
}

export function stampSpace(note?: string): DocBlock {
  return { type: "stamp-space", note };
}

export function spacer(): DocBlock {
  return { type: "spacer" };
}

export function bold(text: string): Run {
  return { text, bold: true };
}

function toRuns(parts: Array<string | Run>): Run[] {
  return parts.map((p) => (typeof p === "string" ? { text: p } : p));
}

/**
 * Clause number formatter: Gujarati numerals in Gujarati documents.
 * no(3, "gu") → "૩." ; no(3, "en") → "3."
 */
export function clauseNo(n: number, lang: Lang): string {
  return lang === "gu" ? `${toGujaratiDigits(n)}.` : `${n}.`;
}

/**
 * Join a list into prose with the language's "and":
 * gu: "અ, બ તથા ક" ; en: "A, B and C".
 */
export function joinList(items: string[], lang: Lang): string {
  const list = items.filter((s) => s.trim() !== "");
  if (list.length === 0) return BLANK;
  if (list.length === 1) return list[0];
  const and = lang === "gu" ? " તથા " : " and ";
  return `${list.slice(0, -1).join(", ")}${and}${list[list.length - 1]}`;
}
