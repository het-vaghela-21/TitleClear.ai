import { readFile } from "node:fs/promises";
import type { BoundingBox, OCRProvider, OCRResult, OcrLang, TextBlock } from "../types";
import { ProviderNotConfiguredError } from "../types";

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

interface VisionVertex {
  x?: number;
  y?: number;
}

interface VisionTextAnnotation {
  description: string;
  boundingPoly?: { vertices?: VisionVertex[] };
  confidence?: number;
}

interface VisionAnnotateResponse {
  responses: Array<{
    fullTextAnnotation?: { text: string };
    textAnnotations?: VisionTextAnnotation[];
    error?: { message: string };
  }>;
}

/**
 * Cloud OCR via the Google Cloud Vision REST API (TEXT_DETECTION), called
 * directly with `fetch` — no @google-cloud/vision SDK dependency, matching
 * the lightweight-client style used elsewhere in this repo (see
 * connectors/gujrera/client.ts). Default provider for the demo per the
 * brief: highest accuracy for Gujarati.
 *
 * Feature-flagged: only usable when `GOOGLE_VISION_API_KEY` is set. Never
 * called by the offline unit tests or the harness's default run — those
 * exercise TesseractProvider so they stay deterministic without a network
 * call or billing account.
 */
export class GoogleVisionProvider implements OCRProvider {
  id = "google";
  displayName = "Google Cloud Vision";

  async extract(imagePath: string, langs: OcrLang[] = ["en", "gu"]): Promise<OCRResult> {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new ProviderNotConfiguredError(
        this.id,
        "GOOGLE_VISION_API_KEY is not set. Set it, or use --provider tesseract for the offline fallback.",
      );
    }

    const imageBytes = await readFile(imagePath);
    const body = {
      requests: [
        {
          image: { content: imageBytes.toString("base64") },
          features: [{ type: "TEXT_DETECTION" }],
          imageContext: { languageHints: langs },
        },
      ],
    };

    const res = await fetch(`${VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Google Vision request failed: HTTP ${res.status} ${await res.text()}`);
    }

    const json = (await res.json()) as VisionAnnotateResponse;
    const result = json.responses?.[0];
    if (result?.error) {
      throw new Error(`Google Vision API error: ${result.error.message}`);
    }

    const annotations = result?.textAnnotations ?? [];
    // annotations[0] is the full-text summary; the rest are per-token.
    const tokens = annotations.slice(1);

    const textBlocks: TextBlock[] = tokens.map((t) => ({
      text: t.description,
      bbox: bboxFromVertices(t.boundingPoly?.vertices ?? []),
      confidence: t.confidence ?? 1,
    }));

    const avgConfidence =
      textBlocks.length > 0
        ? textBlocks.reduce((sum, b) => sum + b.confidence, 0) / textBlocks.length
        : 0;

    return {
      rawText: (result?.fullTextAnnotation?.text ?? annotations[0]?.description ?? "").trim(),
      textBlocks,
      detectedLangs: langs,
      confidence: avgConfidence,
      provider: this.id,
    };
  }
}

function bboxFromVertices(vertices: VisionVertex[]): BoundingBox {
  const xs = vertices.map((v) => v.x ?? 0);
  const ys = vertices.map((v) => v.y ?? 0);
  const x = Math.min(...xs, 0);
  const y = Math.min(...ys, 0);
  return {
    x,
    y,
    width: Math.max(...xs, 0) - x,
    height: Math.max(...ys, 0) - y,
  };
}
