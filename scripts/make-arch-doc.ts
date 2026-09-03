/**
 * Generates MODULE_ARCHITECTURE.docx — a short, printable architecture note
 * with a single self-explanatory diagram.
 *
 * Run:  D:/Titleclear/node_modules/.bin/tsx scripts/make-arch-doc.ts
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

/* ------------------------------------------------------------------ */
/* palette                                                             */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#FFFFFF",
  box: "#F5F7F3",
  boxLine: "#A9B3A5",
  ink: "#1A211C",
  muted: "#5D6960",
  accent: "#4B3E8E",
  accentSoft: "#EDEAF7",
  accentLine: "#8A7DC4",
};

const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const f = (weight: string, size: number) => `${weight} ${size}px ${FONT}`;

/* ------------------------------------------------------------------ */
/* diagram                                                             */
/* ------------------------------------------------------------------ */

const S = 2; // retina scale
const W = 1200;
const H = 606;

function drawDiagram(): Buffer {
  const canvas = createCanvas(W * S, H * S);
  const g = canvas.getContext("2d");
  g.scale(S, S);

  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);

  /* helpers ------------------------------------------------------- */

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    line: string,
    lw = 1.2,
  ) => {
    g.fillStyle = fill;
    g.fillRect(x, y, w, h);
    g.strokeStyle = line;
    g.lineWidth = lw;
    g.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
  };

  const text = (
    s: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = "left",
  ) => {
    g.font = font;
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = "alphabetic";
    g.fillText(s, x, y);
  };

  /** number + NAME on one baseline, returns nothing */
  const heading = (num: string, name: string, x: number, y: number, size = 15) => {
    text(num, x, y, f("700", size), C.accent);
    g.font = f("700", size);
    const nw = g.measureText(num).width;
    text(name, x + nw + 9, y, f("700", size), C.ink);
  };

  const arrowDown = (x: number, y1: number, y2: number, color = C.boxLine) => {
    g.strokeStyle = color;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, y1);
    g.lineTo(x, y2 - 6);
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x, y2);
    g.lineTo(x - 4, y2 - 7);
    g.lineTo(x + 4, y2 - 7);
    g.closePath();
    g.fill();
  };

  const arrowRight = (x1: number, x2: number, y: number, color = C.accentLine) => {
    g.strokeStyle = color;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x1, y);
    g.lineTo(x2 - 6, y);
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x2, y);
    g.lineTo(x2 - 7, y - 4);
    g.lineTo(x2 - 7, y + 4);
    g.closePath();
    g.fill();
  };

  const arrowLeft = (x1: number, x2: number, y: number, color = C.accentLine) => {
    g.strokeStyle = color;
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(x1, y);
    g.lineTo(x2 + 6, y);
    g.stroke();
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(x2, y);
    g.lineTo(x2 + 7, y - 4);
    g.lineTo(x2 + 7, y + 4);
    g.closePath();
    g.fill();
  };

  /* layout -------------------------------------------------------- */

  const M = 40;
  const CW = W - M * 2; // 1120

  // --- 8 App shell ------------------------------------------------
  const shellY = 26;
  const shellH = 58;
  box(M, shellY, CW, shellH, C.box, C.boxLine);
  heading("08", "APP SHELL", M + 18, shellY + 26);
  text(
    "Screens  ·  login  ·  document uploads  ·  the report the customer reads",
    M + 18,
    shellY + 46,
    f("400", 13),
    C.muted,
  );
  text("changes with design, not law", M + CW - 18, shellY + 35, f("italic 400", 12), C.accent, "right");

  arrowDown(W / 2, shellY + shellH, shellY + shellH + 26);

  // --- 1 Flow engine ----------------------------------------------
  const flowY = shellY + shellH + 26;
  const flowH = 88;
  box(M, flowY, CW, flowH, C.accentSoft, C.accent, 1.8);
  heading("01", "FLOW ENGINE", M + 18, flowY + 27);
  text(
    "Runs the steps in order  ·  saves progress after every step  ·  retries what fails",
    M + 18,
    flowY + 47,
    f("400", 13),
    C.muted,
  );
  text(
    "intake  →  read  →  understand  →  classify  →  cross-check  →  score  →  report",
    M + 18,
    flowY + 71,
    f("600", 13),
    C.accent,
  );

  // --- four engines ------------------------------------------------
  const gap = 34;
  const bw = (CW - gap * 3) / 4; // 254
  const bY = flowY + flowH + 30;
  const bH = 158;
  const xs = [M, M + bw + gap, M + (bw + gap) * 2, M + (bw + gap) * 3];

  for (const x of xs) arrowDown(x + bw / 2, flowY + flowH, bY);

  const cells = [
    { num: "03", name: "OCR ENGINE", role: "Reads the scan", io: "picture  →  text", tag: "+ a new language" },
    { num: "04", name: "ML ENGINE", role: "Pulls out the details", io: "text  →  facts", tag: "+ a better model" },
    { num: "02", name: "RULES ENGINE", role: "Judges and scores", io: "facts  →  risk + score", tag: "+ new rules, by users" },
    { num: "07", name: "CONNECTORS", role: "Fetches outside records", io: "portals  →  facts", tag: "+ a new portal" },
  ];

  cells.forEach((c, i) => {
    const x = xs[i];
    box(x, bY, bw, bH, C.box, C.boxLine);
    heading(c.num, c.name, x + 16, bY + 28, 14);
    text(c.role, x + 16, bY + 50, f("400", 12.5), C.muted);

    // divider
    g.strokeStyle = C.boxLine;
    g.lineWidth = 1;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(x + 16, bY + 68);
    g.lineTo(x + bw - 16, bY + 68);
    g.stroke();
    g.setLineDash([]);

    text(c.io, x + 16, bY + 90, f("700", 13), C.accent);

    // change tag block at the foot of the box
    g.fillStyle = C.accentSoft;
    g.fillRect(x + 1, bY + bH - 44, bw - 2, 43);
    text("YOU CHANGE", x + 16, bY + bH - 27, f("700", 9.5), C.accentLine);
    text(c.tag, x + 16, bY + bH - 11, f("600", 12.5), C.accent);

    // re-stroke so the tag band never eats the box outline
    g.strokeStyle = C.boxLine;
    g.lineWidth = 1.2;
    g.strokeRect(x + 0.6, bY + 0.6, bw - 1.2, bH - 1.2);
  });

  // transformation arrows between the engines
  const midY = bY + 90 - 4;
  arrowRight(xs[0] + bw + 4, xs[1] - 4, midY);
  arrowRight(xs[1] + bw + 4, xs[2] - 4, midY);
  arrowLeft(xs[3] - 4, xs[2] + bw + 4, midY);

  // --- base layer ---------------------------------------------------
  const baseY = bY + bH + 34;
  const baseH = 104;
  for (const x of xs) arrowDown(x + bw / 2, bY + bH, baseY);

  box(M, baseY, CW, baseH, C.accentSoft, C.accent, 1.8);

  const halfW = CW / 2;
  heading("05", "SHARED DATA CONTRACTS", M + 18, baseY + 28, 14);
  text("The one list of fields every module uses:", M + 18, baseY + 49, f("400", 12.5), C.muted);
  text(
    "owner · survey no. · village · area · dates · document type",
    M + 18,
    baseY + 67,
    f("400", 12.5),
    C.muted,
  );
  text("A rule can only ask about a field on this list.", M + 18, baseY + 87, f("italic 600", 12), C.accent);

  // vertical split
  g.strokeStyle = C.accentLine;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(M + halfW, baseY + 14);
  g.lineTo(M + halfW, baseY + baseH - 14);
  g.stroke();

  const rx = M + halfW + 22;
  heading("06", "STATE PACKS", rx, baseY + 28, 14);
  text("One folder per state — documents, requirements,", rx, baseY + 49, f("400", 12.5), C.muted);
  text("local words, rates, default rulebook, languages.", rx, baseY + 67, f("400", 12.5), C.muted);
  text("Gujarat  ·  [ Maharashtra ]  ·  [ … ]", rx, baseY + 87, f("700", 12.5), C.accent);

  text("READ BY EVERY MODULE ABOVE", M + CW - 18, baseY + 20, f("700", 9.5), C.accentLine, "right");

  // --- caption ------------------------------------------------------
  const capY = baseY + baseH + 30;
  g.strokeStyle = C.boxLine;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(M, capY - 16);
  g.lineTo(M + CW, capY - 16);
  g.stroke();

  text(
    "Arrows run downwards and inwards only — never sideways between the four engines.",
    M,
    capY + 4,
    f("600", 13.5),
    C.ink,
  );
  text(
    "A change lands inside one box. Nothing above it, and nothing beside it, has to be touched or retested.",
    M,
    capY + 24,
    f("400", 13),
    C.muted,
  );

  return canvas.toBuffer("image/png");
}

/* ------------------------------------------------------------------ */
/* docx helpers                                                        */
/* ------------------------------------------------------------------ */

const INK = "1A211C";
const MUTED = "5D6960";
const ACCENT = "4B3E8E";
const LINE = "C6CEC2";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
const HAIR = { style: BorderStyle.SINGLE, size: 4, color: LINE } as const;

function p(text: string, opts: Partial<{ size: number; color: string; bold: boolean; italics: boolean; after: number; before: number }> = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0, line: 276 },
    children: [
      new TextRun({
        text,
        size: opts.size ?? 20,
        color: opts.color ?? INK,
        bold: opts.bold,
        italics: opts.italics,
      }),
    ],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 70, line: 264 },
    children: [new TextRun({ text, size: 20, color: INK })],
  });
}

function h2(text: string) {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    children: [new TextRun({ text: text.toUpperCase(), size: 17, bold: true, color: ACCENT, characterSpacing: 30 })],
  });
}

function cell(children: Paragraph[], width: number, shaded = false) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 110, right: 110 },
    borders: { top: HAIR, bottom: HAIR, left: NO_BORDER, right: NO_BORDER },
    shading: shaded ? { type: ShadingType.CLEAR, fill: "F2F0FA", color: "auto" } : undefined,
    children,
  });
}

function tcell(text: string, width: number, o: Partial<{ bold: boolean; color: string; size: number; shaded: boolean }> = {}) {
  return cell(
    [
      new Paragraph({
        spacing: { after: 0, line: 250 },
        children: [new TextRun({ text, size: o.size ?? 18, bold: o.bold, color: o.color ?? INK })],
      }),
    ],
    width,
    o.shaded,
  );
}

function headRow(labels: string[], widths: number[]) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) =>
      new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        margins: { top: 60, bottom: 90, left: 110, right: 110 },
        borders: { top: NO_BORDER, bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT }, left: NO_BORDER, right: NO_BORDER },
        children: [
          new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: l.toUpperCase(), size: 15, bold: true, color: ACCENT, characterSpacing: 24 })],
          }),
        ],
      }),
    ),
  });
}

function table(rows: TableRow[], widths: number[]) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows,
  });
}

/* ------------------------------------------------------------------ */
/* document                                                            */
/* ------------------------------------------------------------------ */

async function main() {
  const families = GlobalFonts.families.map((x) => x.family);
  console.log("Segoe UI available:", families.includes("Segoe UI"));

  const png = drawDiagram();
  writeFileSync(join(ROOT, "module-architecture-diagram.png"), png);

  // A4 portrait, 1000 twip margins -> 9906 twips usable
  const USABLE = 9906;

  const imgW = 660;
  const imgH = Math.round((H / W) * imgW);

  const modules: [string, string, string, string][] = [
    ["1", "Flow Engine", "Runs the seven steps in order, saves progress, retries failures.", "Must not know any land law."],
    ["2", "Rules Engine", "Holds the rules users edit; produces flags, review items and the score.", "Must not read files or call AI."],
    ["3", "OCR Engine", "Turns a scan into text, one plug-in per language, with a confidence figure.", "Must not interpret the text."],
    ["4", "ML Engine", "Turns text into organised facts and compares them across documents.", "Must not decide what is bad."],
    ["5", "Contracts", "The one agreed list of fields every module passes around.", "Must stay small and stable."],
    ["6", "State Packs", "One folder per state: documents, requirements, local words, rates, rulebook.", "Must hold data, never logic."],
    ["7", "Connectors", "Fetches records from government portals behind one interface.", "Must stop at a captcha, not solve it."],
    ["8", "App Shell", "Screens, login, file storage, and the report the customer reads.", "Must not contain scoring logic."],
  ];

  const changes: [string, string][] = [
    ["A penalty weight or score threshold", "Rules Engine — numbers only"],
    ["A new required document in Gujarat", "Gujarat state pack"],
    ["A new rule, written by a user", "Rules Engine, through the editor — no code"],
    ["A stamp duty or jantri rate revision", "Gujarat state pack"],
    ["Support Marathi documents", "OCR Engine — one new language pack"],
    ["A better handwriting or extraction model", "OCR / ML Engine — swap the provider"],
    ["Add Maharashtra", "A new state pack, plus its connectors"],
    ["A new pipeline step, e.g. a fraud check", "Flow Engine, plus the one new step"],
    ["A government portal opens up", "Connectors — one new connector"],
    ["Redesign the report screen", "App Shell"],
  ];

  const status: [string, string, string][] = [
    ["Flow Engine", "Built", "Seven steps, progress saved, restart on stall, tested end to end."],
    ["Rules Engine", "Half built", "Rules run and score; the numbers are already data. Not yet user-editable — no editor, no rulebook versions, no effective dates."],
    ["OCR Engine", "Built", "Two engines behind one interface, two languages, accuracy harness. Handwriting is the weak point."],
    ["ML Engine", "Scattered", "All three parts work and are swappable, but sit in two different folders."],
    ["Contracts", "Built", "Shared shapes, document list and bilingual text in place."],
    ["State Packs", "Scattered", "Gujarat is data, not hardcoded — but spread across five files instead of one pack."],
    ["Connectors", "One real", "GujRERA works behind a flag; the rest are mocks on the same interface."],
    ["App Shell", "Built", "Screens, login, document library, report rendering."],
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: INK } },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [
          /* ---- title ---- */
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: "TITLECLEAR  ·  ARCHITECTURE NOTE", size: 15, bold: true, color: ACCENT, characterSpacing: 40 })],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: "How the system is split up", size: 40, bold: true, color: INK })],
          }),
          p(
            "Eight modules with walls between them, so that a change to a law, a language, a state or a model touches one module and leaves the rest alone.",
            { size: 22, color: MUTED, after: 260 },
          ),

          /* ---- diagram ---- */
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new ImageRun({
                type: "png",
                data: png,
                transformation: { width: imgW, height: imgH },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 280 },
            children: [
              new TextRun({
                text: "The whole design in one picture: four engines in a line, a manager above them, and two shared layers underneath.",
                size: 17,
                italics: true,
                color: MUTED,
              }),
            ],
          }),

          /* ---- why ---- */
          h2("Why it is built this way"),
          p("Four things will change under us, repeatedly, for as long as the product exists:", { after: 100 }),
          bullet("Laws change — rates, required documents and red flags are revised regularly, and users must be able to change them without a developer."),
          bullet("States get added — Gujarat today; each new state has different documents, different words and different rules."),
          bullet("Languages get added — Gujarati and English today; Hindi and Marathi later."),
          bullet("Models improve — a better AI arrives every few months and must be swappable."),
          p(
            "If all of that lives in one place, every change is a risk. So each module does one job and hands on an agreed set of fields — like stations on a factory line. A station can be swapped overnight, as long as it accepts and returns the same tray.",
            { before: 120, after: 60 },
          ),

          /* ---- module table ---- */
          h2("The eight modules"),
          table(
            [
              headRow(["#", "Module", "What it does", "What it must not do"], [500, 1500, 4400, 3506]),
              ...modules.map(([n, name, does, not]) =>
                new TableRow({
                  children: [
                    tcell(n, 500, { bold: true, color: ACCENT }),
                    tcell(name, 1500, { bold: true }),
                    tcell(does, 4400),
                    tcell(not, 3506, { color: ACCENT }),
                  ],
                }),
              ),
            ],
            [500, 1500, 4400, 3506],
          ),
          p(
            "Modules 1–4 are the engines that do the work. Modules 5–8 exist so the engines never have to know about each other.",
            { before: 160, size: 18, color: MUTED, italics: true },
          ),

          /* ---- change table ---- */
          h2("What you touch when something changes"),
          p("This table is the real test of the design. Everything not named stays untouched.", { after: 140, color: MUTED }),
          table(
            [
              headRow(["When this changes", "You edit only this"], [4953, 4953]),
              ...changes.map(([when, edit]) =>
                new TableRow({
                  children: [tcell(when, 4953), tcell(edit, 4953, { bold: true, color: ACCENT, shaded: true })],
                }),
              ),
            ],
            [4953, 4953],
          ),
          p(
            "The one guard rail that makes user-written rules safe: a rule can only ask about a field that Module 5 guarantees exists. The editor offers a dropdown, not a free text box — so a user can write a wrong rule, but never a broken one.",
            { before: 200, after: 60 },
          ),

          /* ---- status ---- */
          h2("Where we are today"),
          table(
            [
              headRow(["Module", "Status", "Detail"], [1800, 1400, 6706]),
              ...status.map(([name, st, detail]) =>
                new TableRow({
                  children: [
                    tcell(name, 1800, { bold: true }),
                    tcell(st, 1400, { bold: true, color: ACCENT, shaded: true }),
                    tcell(detail, 6706),
                  ],
                }),
              ),
            ],
            [1800, 1400, 6706],
          ),

          h2("Next three steps, in order"),
          bullet("Consolidate the Gujarat state pack into one folder — cheap now, expensive once a second state exists."),
          bullet("Group the ML engine into one module so extraction, classification and matching sit together."),
          bullet("Make rules user-editable: rulebook storage, versions with effective dates, an editing screen, and test-before-publish. This is what makes the product customisable, and what the rest of the architecture was arranged to support."),

          new Paragraph({
            spacing: { before: 400 },
            border: { top: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 12 } },
            children: [
              new TextRun({
                text: "The goal in one sentence: a law changes, we edit one file in one state pack, and nothing else has to be retested.",
                size: 22,
                bold: true,
                color: INK,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const out = join(ROOT, "MODULE_ARCHITECTURE.docx");
  writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
  console.log("wrote diagram", imgW, "x", imgH);
}

main();
