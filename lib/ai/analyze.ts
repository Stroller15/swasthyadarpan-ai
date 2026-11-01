import { generateText, Output, type LanguageModel } from "ai";
import { getModel } from "@/lib/ai/model";
import { ANALYSIS_PROMPT, SAFETY_RULES } from "@/lib/ai/prompts";
import { AppError } from "@/lib/errors";
import { reconcileFlags } from "@/lib/flags";
import { ReportAnalysisSchema, type ReportAnalysis } from "@/lib/schema";
import type { UploadMediaType } from "@/lib/upload";

export async function analyzeReport(
  input: { data: Uint8Array; mediaType: UploadMediaType },
  model: LanguageModel = getModel(),
): Promise<ReportAnalysis> {
  const { output } = await generateText({
    model,
    temperature: 0.2,
    system: `${ANALYSIS_PROMPT}\n\n${SAFETY_RULES}`,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Explain this report." },
          { type: "file", data: input.data, mediaType: input.mediaType },
        ],
      },
    ],
    output: Output.object({ schema: ReportAnalysisSchema }),
  });

  if (!output.isMedicalReport) {
    throw new AppError("NOT_MEDICAL_REPORT", output.rejectionReason);
  }
  return { ...output, tests: reconcileFlags(output.tests) };
}
