/**
 * DocumentModel → .docx. Runs in the browser (dynamic import keeps the
 * ~300KB docx lib out of the initial bundle). Word output stays editable —
 * many users take the generated deed to a document writer or advocate for
 * final touches, so .docx matters more than PDF here.
 */

import type { DocumentModel, Run } from "./types";

/** Shruti ships with every Windows machine and renders Gujarati correctly in Word. */
const GU_FONT = "Shruti";
const EN_FONT = "Georgia";

export async function exportDocx(model: DocumentModel): Promise<Blob> {
  const docx = await import("docx");
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    UnderlineType,
    WidthType,
  } = docx;

  const font = model.lang === "gu" ? GU_FONT : EN_FONT;
  const baseSize = 24; // half-points → 12pt

  const runs = (rs: Run[], opts?: { size?: number }) =>
    rs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold,
          underline: r.underline ? { type: UnderlineType.SINGLE } : undefined,
          font,
          size: opts?.size ?? baseSize,
        }),
    );

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  const spacing = { line: 400, after: 160 }; // ~1.6 line height, gap after paragraphs

  for (const block of model.blocks) {
    switch (block.type) {
      case "title":
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 400, after: 320 },
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                font,
                size: 32,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
          }),
        );
        break;
      case "subtitle":
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing,
            children: [new TextRun({ text: block.text, bold: true, font, size: baseSize })],
          }),
        );
        break;
      case "para":
        children.push(
          new Paragraph({
            alignment:
              block.align === "center"
                ? AlignmentType.CENTER
                : block.align === "right"
                  ? AlignmentType.RIGHT
                  : block.align === "left"
                    ? AlignmentType.LEFT
                    : AlignmentType.JUSTIFIED,
            spacing,
            children: runs(block.runs),
          }),
        );
        break;
      case "clause":
        children.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing,
            indent: { left: 480, hanging: 480 },
            children: [
              new TextRun({ text: `${block.no}  `, bold: true, font, size: baseSize }),
              ...runs(block.runs),
            ],
          }),
        );
        break;
      case "schedule": {
        if (block.caption) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { line: 400, before: 240, after: 240 },
              children: [
                new TextRun({
                  text: block.caption,
                  bold: true,
                  font,
                  size: baseSize,
                  underline: { type: UnderlineType.SINGLE },
                }),
              ],
            }),
          );
        }
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: block.rows.map(
              (row) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 38, type: WidthType.PERCENTAGE },
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          spacing: { line: 320 },
                          children: [new TextRun({ text: row.label, bold: true, font, size: baseSize })],
                        }),
                      ],
                    }),
                    new TableCell({
                      margins: { top: 80, bottom: 80, left: 120, right: 120 },
                      children: [
                        new Paragraph({
                          spacing: { line: 320 },
                          children: [new TextRun({ text: row.value, font, size: baseSize })],
                        }),
                      ],
                    }),
                  ],
                }),
            ),
          }),
        );
        // Breathing room after the table.
        children.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
        break;
      }
      case "signatures": {
        for (const p of block.parties) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { before: 640, line: 320 },
              children: [
                new TextRun({ text: "____________________", font, size: baseSize }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 320 },
              children: [new TextRun({ text: p.name, bold: true, font, size: baseSize })],
            }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: 320, after: 160 },
              children: [new TextRun({ text: p.role, font, size: baseSize })],
            }),
          );
        }
        break;
      }
      case "witnesses":
        children.push(
          new Paragraph({
            spacing: { before: 320, line: 400, after: 160 },
            children: [
              new TextRun({
                text: block.heading,
                bold: true,
                font,
                size: baseSize,
                underline: { type: UnderlineType.SINGLE },
              }),
            ],
          }),
        );
        block.names.forEach((name, i) => {
          children.push(
            new Paragraph({
              spacing: { line: 400, after: 240 },
              children: [
                new TextRun({ text: `${i + 1}.  ${name}`, font, size: baseSize }),
                new TextRun({ text: "  ____________________", font, size: baseSize }),
              ],
            }),
          );
        });
        break;
      case "stamp-space":
        children.push(
          new Paragraph({
            border: {
              top: { style: BorderStyle.DASHED, size: 4, color: "999999" },
              bottom: { style: BorderStyle.DASHED, size: 4, color: "999999" },
              left: { style: BorderStyle.DASHED, size: 4, color: "999999" },
              right: { style: BorderStyle.DASHED, size: 4, color: "999999" },
            },
            alignment: AlignmentType.CENTER,
            spacing: { before: 1600, after: 1600, line: 320 },
            children: block.note
              ? [new TextRun({ text: block.note, font, size: 18, color: "888888" })]
              : [],
          }),
        );
        break;
      case "spacer":
        children.push(new Paragraph({ spacing: { after: 240 }, children: [] }));
        break;
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font, size: baseSize } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            // A4 with a wider left margin for binding/scanning at the
            // sub-registrar's office.
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1701 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Trigger a browser download of the given blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
