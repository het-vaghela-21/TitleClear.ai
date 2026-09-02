import type { FieldExtractor, OCRProvider } from "./types";
import { TesseractProvider } from "./providers/tesseract-provider";
import { GoogleVisionProvider } from "./providers/google-vision-provider";
import { SuryaProvider } from "./providers/surya-provider";
// "vlm" = Qwen2.5-VL — see providers/vlm-provider.ts for why this model
// was picked and what's left to wire it up for real.
import { VLMProvider } from "./providers/vlm-provider";
import { MockLLMFieldExtractor } from "./extractor/llm-providers/mock-llm-provider";
import { AnthropicFieldExtractor } from "./extractor/llm-providers/anthropic-provider";

export type OcrProviderId = "tesseract" | "google" | "surya" | "vlm";

const PROVIDERS: Record<OcrProviderId, () => OCRProvider> = {
  tesseract: () => new TesseractProvider(),
  google: () => new GoogleVisionProvider(),
  surya: () => new SuryaProvider(),
  vlm: () => new VLMProvider(),
};

/**
 * Resolves an OCRProvider by id, or from `OCR_PROVIDER` env when no id is
 * given. Defaults to "google" per the demo brief (highest accuracy for
 * Gujarati), falling back to "tesseract" if OCR_PROVIDER is unset AND no
 * Google credentials are configured, so the pipeline still runs offline.
 */
export function getOcrProvider(id?: string): OCRProvider {
  const resolved = (id ?? process.env.OCR_PROVIDER ?? defaultProviderId()) as OcrProviderId;
  const factory = PROVIDERS[resolved];
  if (!factory) {
    throw new Error(
      `Unknown OCR provider "${resolved}". Valid options: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  return factory();
}

function defaultProviderId(): OcrProviderId {
  return process.env.GOOGLE_VISION_API_KEY ? "google" : "tesseract";
}

export type LlmProviderId = "mock" | "anthropic";

const LLM_PROVIDERS: Record<LlmProviderId, () => FieldExtractor> = {
  mock: () => new MockLLMFieldExtractor(),
  anthropic: () => new AnthropicFieldExtractor(),
};

/**
 * Resolves a FieldExtractor (LLM provider) by id, or from
 * `FIELD_EXTRACTOR_PROVIDER` env. Defaults to "mock" — a deterministic,
 * offline, rule-based extractor — so tests and the harness never depend on
 * a live LLM call. Set FIELD_EXTRACTOR_PROVIDER=anthropic and ANTHROPIC_API_KEY
 * to use a real model.
 */
export function getFieldExtractor(id?: string): FieldExtractor {
  const resolved = (id ?? process.env.FIELD_EXTRACTOR_PROVIDER ?? "mock") as LlmProviderId;
  const factory = LLM_PROVIDERS[resolved];
  if (!factory) {
    throw new Error(
      `Unknown field extractor provider "${resolved}". Valid options: ${Object.keys(LLM_PROVIDERS).join(", ")}`,
    );
  }
  return factory();
}
