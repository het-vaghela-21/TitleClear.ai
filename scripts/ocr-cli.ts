/**
 * OCR pipeline CLI.
 *
 * Usage:
 *   npm run ocr -- --image <path> --provider tesseract|google
 *
 * (The brief asked for `python -m ocr.run --image <path> --provider ...`.
 * This repo has no Python entry point — see scripts/gujrera-cli.ts for the
 * same call — so this mirrors that shape via tsx instead.)
 */
import { getFieldExtractor, getOcrProvider, type OcrProviderId } from "../src/lib/ocr/registry";

function parseArgs(argv: string[]) {
  const args: { image?: string; provider?: OcrProviderId } = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--image") args.image = argv[i + 1];
    if (argv[i] === "--provider") args.provider = argv[i + 1] as OcrProviderId;
  }
  return args;
}

async function main() {
  const { image, provider } = parseArgs(process.argv.slice(2));
  if (!image) {
    console.error("Usage: npm run ocr -- --image <path> --provider tesseract|google");
    process.exit(1);
  }

  const ocrProvider = getOcrProvider(provider);
  console.error(`Using OCR provider: ${ocrProvider.id}`);
  const ocrResult = await ocrProvider.extract(image, ["en", "gu"]);

  console.log("=== Raw text ===");
  console.log(ocrResult.rawText);
  console.log(`\n=== Confidence: ${(ocrResult.confidence * 100).toFixed(1)}% ===`);

  const extractor = getFieldExtractor();
  const extraction = await extractor.extract(ocrResult);

  console.log("\n=== Extracted fields ===");
  console.log(JSON.stringify(extraction.fields, null, 2));
}

main().catch((err) => {
  console.error(String(err instanceof Error ? err.message : err));
  process.exit(1);
});
