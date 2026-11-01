import { describe, expect, it } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { analyzeReport } from "@/lib/ai/analyze";
import { SAFETY_RULES, buildChatSystemPrompt } from "@/lib/ai/prompts";
import cbc from "@/tests/fixtures/cbc.json";
import notMedical from "@/tests/fixtures/not-medical.json";
import type { ReportAnalysis } from "@/lib/schema";

const modelReturning = (analysis: unknown) =>
  new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(analysis) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      warnings: [],
    }),
  });

const pdf = { data: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), mediaType: "application/pdf" as const };

describe("analyzeReport", () => {
  it("returns the analysis with flags reconciled", async () => {
    const misflagged = structuredClone(cbc);
    misflagged.tests[0].flag = "normal";
    const result = await analyzeReport(pdf, modelReturning(misflagged));
    expect(result.tests[0].name).toBe("Hemoglobin");
    expect(result.tests[0].flag).toBe("low");
  });

  it("throws NOT_MEDICAL_REPORT with the model's reason", async () => {
    await expect(analyzeReport(pdf, modelReturning(notMedical))).rejects.toMatchObject({
      code: "NOT_MEDICAL_REPORT",
      message: notMedical.rejectionReason,
    });
  });

  it("sends the file as a file part with temperature 0.2", async () => {
    const model = modelReturning(cbc);
    await analyzeReport(pdf, model);
    const call = model.doGenerateCalls[0];
    expect(call.temperature).toBe(0.2);
    const userMessage = call.prompt.find((m) => m.role === "user");
    const parts = Array.isArray(userMessage?.content) ? userMessage.content : [];
    expect(parts.some((p) => p.type === "file" && p.mediaType === "application/pdf")).toBe(true);
  });
});

describe("buildChatSystemPrompt", () => {
  it("embeds the analysis and the safety rules", () => {
    const prompt = buildChatSystemPrompt(cbc as ReportAnalysis);
    expect(prompt).toContain("Hemoglobin");
    expect(prompt).toContain(SAFETY_RULES);
  });
});
