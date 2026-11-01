import { z } from "zod";

// Field descriptions double as extraction instructions: the model sees them.

export const FlagSchema = z
  .enum(["low", "normal", "high", "critical", "unknown"])
  .describe(
    "Compare the value against the reference range. Use critical only for dangerously abnormal values; unknown when there is no range to compare against.",
  );
export type Flag = z.infer<typeof FlagSchema>;

export const UrgencySchema = z
  .enum(["routine", "soon", "urgent"])
  .describe(
    "routine if everything is normal or trivially off; soon if anything abnormal should be discussed with a doctor; urgent if any value is critical.",
  );
export type Urgency = z.infer<typeof UrgencySchema>;

export const ReferenceRangeSchema = z.object({
  low: z.number().optional().describe("Lower bound as a plain number, if the range has one."),
  high: z.number().optional().describe("Upper bound as a plain number, if the range has one."),
  text: z.string().describe('The range exactly as printed, e.g. "13 - 17" or "< 200".'),
});
export type ReferenceRange = z.infer<typeof ReferenceRangeSchema>;

export const TestResultSchema = z.object({
  name: z.string().describe("Test name as printed on the report."),
  value: z.string().describe('Result exactly as printed, e.g. "13.2" or "Negative". Never invent a value.'),
  unit: z.string().optional().describe("Unit as printed, if any."),
  referenceRange: ReferenceRangeSchema.optional(),
  flag: FlagSchema,
  explanation: z.string().describe("One plain-language sentence on what this test measures and what this result means."),
  category: z.string().optional().describe('Group this test belongs to, e.g. "Red blood cells" or "Cholesterol".'),
});
export type TestResult = z.infer<typeof TestResultSchema>;

export const ReportAnalysisSchema = z.object({
  isMedicalReport: z.boolean().describe("False if the document is not a medical lab or diagnostic report."),
  rejectionReason: z.string().optional().describe("When isMedicalReport is false, one friendly sentence saying what the document appears to be."),
  reportType: z.string().describe('Type of report, e.g. "Complete Blood Count".'),
  reportDate: z.string().optional().describe("Report or sample date as printed."),
  patient: z
    .object({
      name: z.string().optional(),
      age: z.string().optional(),
      sex: z.string().optional(),
    })
    .optional(),
  summary: z.string().describe("Two to four plain-language sentences summarising the report for the patient."),
  tests: z.array(TestResultSchema).describe("Every test on the report, in printed order."),
  keyFindings: z.array(z.string()).describe("The most important points, abnormal results first."),
  questionsForDoctor: z.array(z.string()).describe("Questions the patient could ask their doctor about these results."),
  generalTips: z.array(z.string()).describe("General wellness tips relevant to the results. Never treatment or medication advice."),
  urgency: UrgencySchema,
});
export type ReportAnalysis = z.infer<typeof ReportAnalysisSchema>;
