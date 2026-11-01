import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai/model";
import { MAX_CHAT_MESSAGES } from "@/lib/constants";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { AppError, errorResponse, toAppError } from "@/lib/errors";
import { chatLimiter, clientKey } from "@/lib/rate-limit";
import { ReportAnalysisSchema } from "@/lib/schema";

export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 1000;
const MAX_ANALYSIS_CHARS = 50_000;
export const maxDuration = 60;

const ChatBodySchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.enum(["user", "assistant"]),
          // Text only: the chat must not become a free multimodal proxy to the model.
          parts: z
            .array(
              z.union([
                z.object({ type: z.literal("text"), text: z.string().max(MAX_MESSAGE_CHARS) }).loose(),
                z.object({ type: z.literal("step-start") }), // content-free marker in assistant replies
              ]),
            )
            .min(1),
        })
        .loose(),
    )
    .min(1)
    .max(MAX_CHAT_MESSAGES),
  analysis: ReportAnalysisSchema.refine((a) => JSON.stringify(a).length <= MAX_ANALYSIS_CHARS),
});

export async function POST(req: Request): Promise<Response> {
  try {
    chatLimiter.check(clientKey(req));

    const parsed = ChatBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new AppError("BAD_REQUEST");
    const validated = await safeValidateUIMessages({ messages: parsed.data.messages });
    if (!validated.success) throw new AppError("BAD_REQUEST");

    const result = streamText({
      model: getModel(),
      system: buildChatSystemPrompt(parsed.data.analysis),
      messages: await convertToModelMessages(validated.data),
      maxRetries: 1,
    });
    // Errors after streaming starts (e.g. quota) reach the client as a friendly message.
    return result.toUIMessageStreamResponse({ onError: (err) => toAppError(err).message });
  } catch (err) {
    return errorResponse(err);
  }
}

