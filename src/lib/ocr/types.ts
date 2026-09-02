/**
 * Common shape every OCR provider implements, local or cloud. Callers
 * (FieldExtractor, the CLI, the test harness) only ever talk to this
 * interface, so a real provider can be swapped in — or swapped out for a
 * better one — without touching anything downstream. Mirrors the
 * `SourceConnector` pattern in `src/lib/connectors/types.ts`.
 */

export type OcrLang = "en" | "gu";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextBlock {
  text: string;
  bbox: BoundingBox;
  confidence: number; // 0-1
  lang?: OcrLang;
}

export interface OCRResult {
  rawText: string;
  textBlocks: TextBlock[];
  detectedLangs: OcrLang[];
  confidence: number; // 0-1, overall
  provider: string;
}

export interface OCRProvider {
  id: string;
  displayName: string;
  extract(imagePath: string, langs?: OcrLang[]): Promise<OCRResult>;
}

/** Thrown by provider stubs that aren't implemented yet (Surya, VLM). */
export class NotImplementedProviderError extends Error {
  constructor(providerId: string) {
    super(`OCR provider "${providerId}" is not implemented yet.`);
    this.name = "NotImplementedProviderError";
  }
}

/**
 * Thrown when a provider is selected but isn't usable in the current
 * environment (e.g. GoogleVisionProvider without an API key). Distinct from
 * NotImplementedProviderError so callers can tell "not built yet" apart
 * from "built, but not configured here."
 */
export class ProviderNotConfiguredError extends Error {
  constructor(providerId: string, reason: string) {
    super(`OCR provider "${providerId}" is not configured: ${reason}`);
    this.name = "ProviderNotConfiguredError";
  }
}

// ---- Stage 2: structured field extraction ----

/**
 * Structured fields a document might carry, matching our records/owners
 * data model (src/lib/types.ts: Owner, Property) plus a few OCR-specific
 * document fields. Every field is optional — extraction from noisy OCR
 * text is best-effort, and callers should treat missing fields as
 * "not found," not as an error.
 */
export interface ExtractedFields {
  docType?: string; // e.g. "7/12 Extract", "Index-2", "Sale Deed"
  ownerName?: string;
  surveyNo?: string;
  khataNo?: string;
  village?: string;
  district?: string;
  areaValue?: number;
  areaUnit?: string;
  transactionDate?: string; // ISO date if resolvable
  transactionType?: string; // e.g. "Sale Deed", "Gift Deed"
}

export interface FieldExtractionResult {
  fields: ExtractedFields;
  /** Raw model output before parsing, kept for debugging/harness scoring. */
  raw: string;
  provider: string;
}

export interface FieldExtractor {
  id: string;
  extract(ocr: OCRResult): Promise<FieldExtractionResult>;
}
