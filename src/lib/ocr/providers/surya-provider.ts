import type { OCRProvider, OCRResult, OcrLang } from "../types";
import { NotImplementedProviderError } from "../types";

/**
 * Stub for a future Surya (github.com/VikParuchuri/surya) integration —
 * a transformer-based OCR model with strong non-Latin-script support that
 * could beat Tesseract on Gujarati. Not wired up yet: Surya runs as a
 * Python model, so this provider would need a small local inference
 * service (or a subprocess call) behind this same interface. Left as a
 * clearly-marked stub per the brief rather than a partial implementation.
 */
export class SuryaProvider implements OCRProvider {
  id = "surya";
  displayName = "Surya (not implemented)";

  async extract(_imagePath: string, _langs?: OcrLang[]): Promise<OCRResult> {
    throw new NotImplementedProviderError(this.id);
  }
}
