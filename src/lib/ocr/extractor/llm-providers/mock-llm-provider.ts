import type { ExtractedFields, FieldExtractionResult, FieldExtractor, OCRResult } from "../../types";

/**
 * Deterministic, offline, rule-based field extractor. Default provider so
 * unit tests and the harness never depend on a live LLM call. Not meant to
 * be smart — it pattern-matches the label/value pairs our synthetic
 * generator renders (labels in English and Gujarati) so the pipeline is
 * end-to-end testable without API credentials. Swap in
 * AnthropicFieldExtractor for real documents.
 */
export class MockLLMFieldExtractor implements FieldExtractor {
  id = "mock";

  async extract(ocr: OCRResult): Promise<FieldExtractionResult> {
    const text = ocr.rawText;
    const fields: ExtractedFields = {
      docType: matchLabel(text, ["Document Type", "દસ્તાવેજનો પ્રકાર"]),
      ownerName: matchLabel(text, ["Owner Name", "Owner", "માલિકનું નામ"]),
      surveyNo: matchLabel(text, ["Survey No", "Survey Number", "સર્વે નંબર"]),
      khataNo: matchLabel(text, ["Khata No", "Khata Number", "ખાતા નંબર"]),
      village: matchLabel(text, ["Village", "ગામ"]),
      district: matchLabel(text, ["District", "જિલ્લો"]),
      transactionType: matchLabel(text, ["Transaction Type", "વ્યવહારનો પ્રકાર"]),
      transactionDate: normalizeDate(matchLabel(text, ["Date", "તારીખ"])),
      ...parseArea(matchLabel(text, ["Area", "ક્ષેત્રફળ"])),
    };

    return { fields, raw: text, provider: this.id };
  }
}

function matchLabel(text: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}\\s*[:：]\\s*(.+)`, "u");
    const line = text.split("\n").find((l) => re.test(l));
    const match = line?.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function normalizeDate(value?: string): string | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (!match) return value;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseArea(value?: string): { areaValue?: number; areaUnit?: string } {
  if (!value) return {};
  const match = value.match(/([\d.]+)\s*(sq\.?\s?m|sq\.?\s?ft|acre|guntha|bigha)/i);
  if (!match) return {};
  return { areaValue: parseFloat(match[1]), areaUnit: normalizeUnit(match[2]) };
}

function normalizeUnit(raw: string): string {
  const u = raw.toLowerCase().replace(/\s|\./g, "");
  if (u.startsWith("sqm")) return "sq_m";
  if (u.startsWith("sqft")) return "sq_ft";
  if (u.startsWith("acre")) return "acre";
  if (u.startsWith("guntha")) return "guntha";
  if (u.startsWith("bigha")) return "bigha";
  return raw;
}
