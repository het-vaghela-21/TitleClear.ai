import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedFields, FieldExtractionResult, FieldExtractor, OCRResult } from "../../types";

const FIELD_SCHEMA = {
  type: "object" as const,
  properties: {
    docType: { type: "string" },
    ownerName: { type: "string" },
    surveyNo: { type: "string" },
    khataNo: { type: "string" },
    village: { type: "string" },
    district: { type: "string" },
    areaValue: { type: "number" },
    areaUnit: { type: "string" },
    transactionDate: { type: "string", format: "date" },
    transactionType: { type: "string" },
  },
  additionalProperties: false,
};

/**
 * Real LLM-backed extractor (Claude), for use against real OCR output once
 * this workstream is reviewed for production documents. Feature-flagged via
 * FIELD_EXTRACTOR_PROVIDER=anthropic; the harness and unit tests default to
 * MockLLMFieldExtractor so they stay offline and deterministic.
 */
export class AnthropicFieldExtractor implements FieldExtractor {
  id = "anthropic";

  async extract(ocr: OCRResult): Promise<FieldExtractionResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AnthropicFieldExtractor requires ANTHROPIC_API_KEY. Use FIELD_EXTRACTOR_PROVIDER=mock for offline runs.",
      );
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low", format: { type: "json_schema", schema: FIELD_SCHEMA } },
      messages: [
        {
          role: "user",
          content: `Extract structured fields from this OCR text of a Gujarat property document (RoR / Index-2 / sale deed). Text may mix Gujarati and English. Leave fields blank if not present.\n\n${ocr.rawText}`,
        },
      ],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    const raw = textBlock?.text ?? "";
    const fields: ExtractedFields = raw ? JSON.parse(raw) : {};

    return { fields, raw, provider: this.id };
  }
}
