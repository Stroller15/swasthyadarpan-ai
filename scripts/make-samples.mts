// Generates the synthetic sample PDFs in public/samples from the test fixtures.
// Run with: npm run samples
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ReportAnalysisSchema } from "../lib/schema";
import { SAMPLES } from "../lib/samples";

const ROOT = join(import.meta.dirname, "..");
const COLUMNS = [50, 250, 340, 430];

async function makeSample(id: string, outPath: string) {
  const report = ReportAnalysisSchema.parse(
    JSON.parse(readFileSync(join(ROOT, "tests/fixtures", `${id}.json`), "utf8")),
  );
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${report.reportType} (sample)`);
  const page = pdf.addPage([595, 842]); // A4
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const grey = rgb(0.4, 0.4, 0.4);
  let y = 790;

  const text = (value: string, x: number, size = 10, font = regular, color = rgb(0, 0, 0)) =>
    page.drawText(value, { x, y, size, font, color });

  text("Sample Diagnostics Lab", 50, 18, bold);
  y -= 18;
  text("SAMPLE REPORT — fictitious patient, for demonstration only", 50, 9, regular, grey);
  y -= 30;
  text(`Patient: ${report.patient?.name ?? "—"}`, 50);
  text(`Age/Sex: ${report.patient?.age ?? "—"} / ${report.patient?.sex ?? "—"}`, 300);
  y -= 15;
  text(`Report date: ${report.reportDate ?? "—"}`, 50);
  y -= 30;
  text(report.reportType, 50, 13, bold);
  y -= 22;

  ["Test", "Result", "Unit", "Reference range"].forEach((h, i) => text(h, COLUMNS[i], 10, bold));
  y -= 6;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: grey });
  y -= 16;
  for (const test of report.tests) {
    [test.name, test.value, test.unit ?? "", test.referenceRange?.text ?? ""].forEach((cell, i) =>
      text(cell, COLUMNS[i]),
    );
    y -= 18;
  }

  y -= 20;
  text("This document was generated for the SwasthyaDarpan demo and contains no real patient data.", 50, 8, regular, grey);
  writeFileSync(outPath, await pdf.save());
}

for (const sample of SAMPLES) {
  await makeSample(sample.id, join(ROOT, "public", sample.path));
  console.log(`wrote public${sample.path}`);
}
