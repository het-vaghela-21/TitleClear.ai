/**
 * Core types for the document-filler module.
 *
 * The design separates three layers so each is swappable:
 *
 *   1. Template definition (`DocTemplate`) — a form schema (what to ask the
 *      user) plus a `build()` function that turns answers into a
 *      `DocumentModel`.
 *   2. Document model (`DocumentModel`) — a renderer-agnostic list of blocks
 *      (paragraphs, clauses, schedules, signature rows). Nothing here knows
 *      about React, HTML or Word.
 *   3. Renderers — the HTML preview, the print stylesheet and the .docx
 *      exporter all consume the same `DocumentModel`, so adding an output
 *      format never touches the templates.
 *
 * Everything user-visible is a `LText` ({ en, gu }) so the UI can run in
 * English or Gujarati; the generated documents themselves are written in the
 * language(s) each template declares in `languages`.
 */

/** UI / document language. Gujarati first-class, English secondary. */
export type Lang = "gu" | "en";

/** A localized string. `gu` is required — this product is Gujarati-first. */
export interface LText {
  gu: string;
  en: string;
}

/* ------------------------------------------------------------------ */
/* Form schema                                                         */
/* ------------------------------------------------------------------ */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  /** Rupee amount; templates can render it as figures + Gujarati words. */
  | "money"
  | "date"
  | "select";

export interface SelectOption {
  value: string;
  label: LText;
}

export interface FieldDef {
  id: string;
  kind: FieldKind;
  label: LText;
  /** Example value shown inside the empty input. */
  placeholder?: LText;
  /** One-line helper shown under the input. */
  help?: LText;
  required?: boolean;
  /**
   * The final document expects this value in Gujarati script (names,
   * addresses…). The form offers transliteration help on these fields.
   */
  gujarati?: boolean;
  options?: SelectOption[];
  /** Layout hint for the two-column form grid. Defaults to 1. */
  colSpan?: 1 | 2;
  defaultValue?: string;
}

/**
 * A repeating group of fields — e.g. "sellers", "buyers", "witnesses".
 * The user can add between `min` and `max` entries.
 */
export interface FieldGroup {
  id: string;
  kind: "group";
  /** Singular noun for one entry, e.g. { en: "Seller", gu: "વેચનાર" }. */
  entryLabel: LText;
  addLabel?: LText;
  min: number;
  max: number;
  fields: FieldDef[];
}

export type AnyField = FieldDef | FieldGroup;

export function isGroup(field: AnyField): field is FieldGroup {
  return field.kind === "group";
}

export interface FormSection {
  id: string;
  title: LText;
  description?: LText;
  fields: AnyField[];
}

/** One group entry's values, keyed by inner field id. */
export type GroupEntry = Record<string, string>;

/** All values for a document draft, keyed by field / group id. */
export type FieldValues = Record<string, string | GroupEntry[]>;

/* ------------------------------------------------------------------ */
/* Document model                                                      */
/* ------------------------------------------------------------------ */

/** A run of text within a paragraph. Kept minimal on purpose. */
export interface Run {
  text: string;
  bold?: boolean;
  underline?: boolean;
}

export type Align = "left" | "center" | "justify" | "right";

export type DocBlock =
  /** The document's main heading, centered and underlined by renderers. */
  | { type: "title"; text: string }
  /** A centered secondary line (e.g. property short description). */
  | { type: "subtitle"; text: string }
  | { type: "para"; runs: Run[]; align?: Align }
  /** A numbered clause; `no` is pre-formatted ("૧.", "(ક)", "1."). */
  | { type: "clause"; no: string; runs: Run[] }
  /** Label/value rows — used for property schedules ("મિલકતનું વર્ણન"). */
  | { type: "schedule"; caption?: string; rows: { label: string; value: string }[] }
  /** Signature slots laid out side by side, in order given. */
  | {
      type: "signatures";
      parties: { role: string; name: string }[];
    }
  /** Witness list with dotted lines for signature. */
  | { type: "witnesses"; heading: string; names: string[] }
  /** Reserved blank area at the top of page 1 for e-stamp / franking. */
  | { type: "stamp-space"; note?: string }
  | { type: "spacer" };

export interface DocumentModel {
  lang: Lang;
  /** Used for the file name and print title. */
  title: string;
  blocks: DocBlock[];
}

/* ------------------------------------------------------------------ */
/* Template                                                            */
/* ------------------------------------------------------------------ */

export type DocCategory =
  | "sale" // વેચાણ — sale-related deeds
  | "lease" // ભાડું — rent / leave-and-licence
  | "authority" // અધિકારપત્ર — POA and the like
  | "declaration" // સોગંદનામા વગેરે
  | "family" // વારસાઈ / બક્ષિસ / હક્કકમી
  | "other";

export const CATEGORY_LABELS: Record<DocCategory, LText> = {
  sale: { en: "Sale & transfer", gu: "વેચાણ અને તબદીલી" },
  lease: { en: "Rent & lease", gu: "ભાડું અને લીઝ" },
  authority: { en: "Power of attorney", gu: "કુલમુખત્યારનામું" },
  declaration: { en: "Affidavits & declarations", gu: "સોગંદનામાં અને જાહેરાતો" },
  family: { en: "Family & inheritance", gu: "કુટુંબ અને વારસાઈ" },
  other: { en: "Other", gu: "અન્ય" },
};

export interface DocTemplate {
  /** URL slug, e.g. "banakhat". Stable — used for drafts and links. */
  slug: string;
  name: LText;
  /** Shorter name for cards / breadcrumbs. */
  shortName?: LText;
  category: DocCategory;
  description: LText;
  /**
   * Plain-language stamp-duty / registration guidance shown alongside the
   * form. Informational only — rates change; always says "verify".
   */
  stampNote?: LText;
  /** Body languages this template can generate. First entry is default. */
  languages: Lang[];
  sections: FormSection[];
  /** Turns the collected values into a renderable document. */
  build: (values: FieldValues, lang: Lang) => DocumentModel;
}

/* ------------------------------------------------------------------ */
/* Small helpers shared by templates and renderers                     */
/* ------------------------------------------------------------------ */

export function ltext(l: LText, lang: Lang): string {
  return lang === "gu" ? l.gu : l.en;
}

/** Standard blank used when a field hasn't been filled yet. */
export const BLANK = "________";

export function orBlank(value: string | undefined | null, blank = BLANK): string {
  const v = (value ?? "").trim();
  return v === "" ? blank : v;
}
