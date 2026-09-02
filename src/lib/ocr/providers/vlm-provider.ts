import type { OCRProvider, OCRResult, OcrLang } from "../types";
import { NotImplementedProviderError } from "../types";

/**
 * Stub for a Qwen2.5-VL-backed provider — feeding the page image directly
 * to a multimodal LLM and asking for transcribed text, instead of running
 * a dedicated OCR engine. Picked over other open vision-language OCR
 * candidates (GOT-OCR2.0, IIT-B's indic-trocr) because Qwen2.5-VL is the
 * only one with demonstrated strong multilingual + handwriting OCR
 * benchmarks (OCRBench, OmniDocBench) and Gujarati is not excluded by a
 * fixed language list the way it is for Tesseract/PaddleOCR — the model
 * reads whatever script is in the image. This matters here because
 * dedicated OCR engines top out around 55-70% on clear handwritten
 * Gujarati; a general-purpose VLM is currently the more realistic path to
 * better than that.
 *
 * Not wired up yet — it needs a hosting decision first, since unlike
 * Tesseract this can't just run in-process:
 *   1. Hosted inference API (OpenRouter / Together / Fireworks) — set an
 *      API key in .env, no local GPU required. Fastest to turn on.
 *   2. Local Ollama (`ollama pull qwen2.5vl`) — free/private, requires a
 *      GPU with enough VRAM on the machine running this app.
 *   3. Self-hosted vLLM/TGI endpoint — for higher-volume use.
 *
 * Once a hosting path is chosen, this provider should call that endpoint
 * with the page image + a transcription prompt (langs hinting "en"/"gu"),
 * parse the response into OCRResult.rawText, and — since VLMs don't
 * natively return per-token bounding boxes — leave `textBlocks` empty or
 * approximate it with a follow-up grounding call if bboxes turn out to be
 * needed downstream.
 */
export class VLMProvider implements OCRProvider {
  id = "vlm";
  displayName = "Qwen2.5-VL (not implemented)";

  async extract(_imagePath: string, _langs?: OcrLang[]): Promise<OCRResult> {
    throw new NotImplementedProviderError(this.id);
  }
}
