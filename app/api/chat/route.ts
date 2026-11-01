import { convertToModelMessages, safeValidateUIMessages, streamText } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai/model";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { AppError, errorResponse, toAppError } from "@/lib/errors";
import { chatLimiter, clientKey } from "@/lib/rate-limit";
import { ReportAnalysisSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export const MAX_CHAT_MESSAGES = 20;

const ChatBodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]) }).loose())
    .min(1)
    .max(MAX_CHAT_MESSAGES),
  analysis: ReportAnalysisSchema,
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
    });
    // Errors after streaming starts (e.g. quota) reach the client as a friendly message.
    return result.toUIMessageStreamResponse({ onError: (err) => toAppError(err).message });
  } catch (err) {
    return errorResponse(err);
  }
}

