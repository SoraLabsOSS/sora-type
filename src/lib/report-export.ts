import type { Font as FontkitFont } from "fontkit";
import PDFDocument from "pdfkit";
import {
  detectLanguages,
  type LanguageSupportResult,
  reportAllLanguages,
} from "@/lib/font-language-detection";
import {
  type LanguageSupportSummary,
  summarizeSupport,
} from "@/lib/font-report";

export interface FontReport {
  font: {
    familyName: string;
    fileName: string;
    fullName: string;
    numGlyphs: number;
    style: string;
    unitsPerEm: number;
    version?: string;
  };
  generatedAt: string;
  languages: LanguageSupportResult[];
  summary: LanguageSupportSummary;
}

export function buildFontReport(
  font: FontkitFont,
  fontData: ArrayBuffer | undefined,
  fileName: string,
  mode: "all" | "detected" = "all"
): FontReport {
  const languages =
    mode === "all"
      ? reportAllLanguages(font, fontData)
      : detectLanguages(font, fontData);

  return {
    generatedAt: new Date().toISOString(),
    font: {
      fileName,
      fullName: font.fullName,
      familyName: font.familyName,
      style: font.subfamilyName,
      version: font.version ? String(font.version) : undefined,
      numGlyphs: font.numGlyphs,
      unitsPerEm: font.unitsPerEm,
    },
    languages,
    summary: summarizeSupport(languages),
  };
}

export function exportReportAsJson(report: FontReport): string {
  return JSON.stringify(report, null, 2);
}

const SUPPORT_LABELS: Record<LanguageSupportResult["support"], string> = {
  full: "Full support",
  decomposed: "Supported via combining marks",
  "positioning-failed": "Glyphs present, positioning failed",
  none: "Not supported",
};

export function exportReportAsPdf(report: FontReport): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);

    doc
      .fontSize(20)
      .text(report.font.fullName, { continued: false })
      .fontSize(11)
      .fillColor("#555")
      .text(`${report.font.familyName} — ${report.font.style}`)
      .moveDown(0.5)
      .fillColor("#000")
      .fontSize(10)
      .text(`File: ${report.font.fileName}`)
      .text(`Version: ${report.font.version ?? "unknown"}`)
      .text(`Glyphs: ${report.font.numGlyphs}`)
      .text(`Units per em: ${report.font.unitsPerEm}`)
      .text(`Generated: ${report.generatedAt}`)
      .moveDown();

    doc
      .fontSize(14)
      .text("Language support summary")
      .fontSize(10)
      .text(
        `Full: ${report.summary.full}  ·  Decomposed: ${report.summary.decomposed}  ·  ` +
          `Positioning failed: ${report.summary.positioningFailed}  ·  None: ${report.summary.none}  ·  ` +
          `Total checked: ${report.summary.total}`
      )
      .moveDown();

    doc.fontSize(14).text("Languages").moveDown(0.25);
    for (const lang of report.languages) {
      if (lang.support === "none") {
        continue;
      }
      doc
        .fontSize(10)
        .text(
          `${lang.name} (${lang.code}, ${lang.script}) — ${SUPPORT_LABELS[lang.support]}`
        );
    }

    doc.end();
  });
}
