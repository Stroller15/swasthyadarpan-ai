import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { createMockModel } from "@/lib/ai/mock-model";

// Alias that tracks Google's newest Flash model, which reads PDFs and images
// natively and has been on the free tier. Checked 2026-11-01; override with AI_MODEL.
export const DEFAULT_MODEL = "gemini-flash-latest";

export function getModel(): LanguageModel {
  if (process.env.AI_MOCK === "1") return createMockModel();
  return google(process.env.AI_MODEL || DEFAULT_MODEL);
}
