import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { buildSyntheticDoc, groundTruthFields, referenceText } from "./templates";

const FONTS_DIR = path.join(__dirname, "fonts");
const WIDTH = 1000;
const HEIGHT = 1300;

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "NotoSans.ttf"), "Noto Sans");
  GlobalFonts.registerFromPath(path.join(FONTS_DIR, "NotoSansGujarati.ttf"), "Noto Sans Gujarati");
  fontsRegistered = true;
}

/**
 * Renders one synthetic RoR/Index-2-style document image (English labels +
 * Gujarati labels/values on a simple form layout) and writes it, plus its
 * ground-truth field JSON, to `outDir`. Deterministic given `seed`.
 */
export function generateSyntheticDoc(seed: number, outDir: string): { imagePath: string; jsonPath: string } {
  registerFonts();
  mkdirSync(outDir, { recursive: true });

  const doc = buildSyntheticDoc(seed);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

  ctx.fillStyle = "#000000";
  ctx.font = "32px 'Noto Sans Gujarati'";
  ctx.textAlign = "center";
  ctx.fillText(doc.titleGu, WIDTH / 2, 90);
  ctx.font = "28px 'Noto Sans'";
  ctx.fillText(doc.titleEn, WIDTH / 2, 135);

  ctx.textAlign = "left";
  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 165);
  ctx.lineTo(WIDTH - 60, 165);
  ctx.stroke();

  let y = 220;
  const rowHeight = 110;
  for (const field of doc.fields) {
    ctx.font = "22px 'Noto Sans Gujarati'";
    ctx.fillText(field.labelGu, 60, y);
    ctx.font = "20px 'Noto Sans'";
    ctx.fillText(`(${field.labelEn})`, 60, y + 28);

    ctx.font = "26px 'Noto Sans Gujarati'";
    ctx.fillText(`${field.labelEn} : ${field.value}`, 60, y + 62);

    y += rowHeight;
  }

  const imagePath = path.join(outDir, `${doc.id}.png`);
  const jsonPath = path.join(outDir, `${doc.id}.json`);
  writeFileSync(imagePath, canvas.toBuffer("image/png"));
  writeFileSync(
    jsonPath,
    JSON.stringify(
      { id: doc.id, docType: doc.docType, fields: groundTruthFields(doc), referenceText: referenceText(doc) },
      null,
      2,
    ),
  );

  return { imagePath, jsonPath };
}

/** Generates `count` synthetic docs (seeds 0..count-1) into outDir. */
export function generateSyntheticSet(count: number, outDir: string): string[] {
  const ids: string[] = [];
  for (let seed = 0; seed < count; seed++) {
    const { imagePath } = generateSyntheticDoc(seed, outDir);
    ids.push(imagePath);
  }
  return ids;
}

if (require.main === module) {
  const outDir = process.argv[2] ?? path.join(__dirname, "fixtures");
  const count = Number(process.argv[3] ?? 8);
  const paths = generateSyntheticSet(count, outDir);
  console.log(`Generated ${paths.length} synthetic docs in ${outDir}`);
}
