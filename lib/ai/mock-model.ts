import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import cbc from "@/tests/fixtures/cbc.json";

export const MOCK_CHAT_REPLY =
  "Your hemoglobin is a little below the usual range. Please discuss it with your doctor.";

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};
const finishReason = { unified: "stop" as const, raw: undefined };

/** Deterministic model for tests and CI: analysis returns the CBC fixture, chat streams a fixed reply. */
export function createMockModel() {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(cbc) }],
      finishReason,
      usage,
      warnings: [],
    }),
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "text-1" },
          ...MOCK_CHAT_REPLY.split(" ").map((word, i) => ({
            type: "text-delta" as const,
            id: "text-1",
            delta: i === 0 ? word : ` ${word}`,
          })),
          { type: "text-end", id: "text-1" },
          { type: "finish", finishReason, logprobs: undefined, usage },
        ],
      }),
    }),
  });
}
