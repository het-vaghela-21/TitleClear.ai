import { createWorker } from "tesseract.js";
import type { BoundingBox, OCRProvider, OCRResult, OcrLang, TextBlock } from "../types";

/** tesseract.js language codes, as distinct from our "en"/"gu" ids. */
const TESSERACT_LANG: Record<OcrLang, string> = {
  en: "eng",
  gu: "guj",
};

/**
 * Local, offline, free OCR via tesseract.js (WASM build of Tesseract).
 * Downloads eng.traineddata / guj.traineddata on first use (tesseract.js
 * default CDN) unless `TESSERACT_LANG_PATH` points at a local cache
 * directory — set that for fully offline/deterministic runs. This is the
 * fallback provider: no cloud credentials required.
 */
export class TesseractProvider implements OCRProvider {
  id = "tesseract";
  displayName = "Tesseract (local)";

  async extract(imagePath: string, langs: OcrLang[] = ["en", "gu"]): Promise<OCRResult> {
    const tesseractLangs = langs.map((l) => TESSERACT_LANG[l]).join("+");
    const langPath = process.env.TESSERACT_LANG_PATH;

    const worker = await createWorker(tesseractLangs, undefined, langPath ? { langPath } : undefined);
    try {
      const { data } = await worker.recognize(imagePath, {}, { blocks: true });

      const words = (data.blocks ?? []).flatMap((block) =>
        block.paragraphs.flatMap((para) => para.lines.flatMap((line) => line.words)),
      );

      const textBlocks: TextBlock[] = words.map((w) => ({
        text: w.text,
        bbox: bboxFromCorners(w.bbox),
        confidence: w.confidence / 100,
      }));

      const avgConfidence =
        textBlocks.length > 0
          ? textBlocks.reduce((sum, b) => sum + b.confidence, 0) / textBlocks.length
          : (data.confidence ?? 0) / 100;

      return {
        rawText: data.text.trim(),
        textBlocks,
        detectedLangs: langs,
        confidence: avgConfidence,
        provider: this.id,
      };
    } finally {
      await worker.terminate();
    }
  }
}

function bboxFromCorners(c: { x0: number; y0: number; x1: number; y1: number }): BoundingBox {
  return { x: c.x0, y: c.y0, width: c.x1 - c.x0, height: c.y1 - c.y0 };
}
