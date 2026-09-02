import path from "node:path";
import { runHarness } from "./run-harness";
import type { OcrProviderId } from "../registry";

const fixturesDir = process.argv[2] ?? path.join(__dirname, "..", "fixtures", "synthetic");
const providers = (process.argv[3]?.split(",") as OcrProviderId[]) ?? (["tesseract"] as OcrProviderId[]);

(async () => {
  for (const providerId of providers) {
    console.log(`\n=== Provider: ${providerId} ===`);
    try {
      const result = await runHarness(fixturesDir, providerId);
      console.log(`Docs: ${result.docCount}`);
      console.log(`CER (English):  ${(result.cerEn * 100).toFixed(1)}%`);
      console.log(`CER (Gujarati): ${(result.cerGu * 100).toFixed(1)}%`);
      console.log(`Field accuracy: ${(result.fieldAccuracy * 100).toFixed(1)}%`);
    } catch (err) {
      console.error(`Provider ${providerId} failed: ${err instanceof Error ? err.message : err}`);
    }
  }
})();
