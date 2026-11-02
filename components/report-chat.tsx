"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MAX_CHAT_MESSAGES } from "@/lib/constants";
import type { ReportAnalysis } from "@/lib/schema";
import { cn } from "@/lib/utils";

export const STARTER_QUESTIONS = [
  "What should I ask my doctor first?",
  "Explain my abnormal results simply",
  "Is anything here urgent?",
];

const FALLBACK_ERROR = "Something went wrong. Please try again.";

/** The transport throws with the response body as the message; pull out our API's friendly text. */
function readableError(error: Error): string {
  try {
    return JSON.parse(error.message).error?.message ?? FALLBACK_ERROR;
  } catch {
    return error.message || FALLBACK_ERROR;
  }
}

const messageText = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

export function ReportChat({
  analysis,
  maxMessages = MAX_CHAT_MESSAGES,
}: {
  analysis: ReportAnalysis;
  maxMessages?: number;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat", body: { analysis } }), [analysis]);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");

  const busy = status === "submitted" || status === "streaming";
  const limitReached = messages.length + 1 > maxMessages;

  const ask = (text: string) => {
    const question = text.trim();
    if (!question || busy || limitReached) return;
    setInput("");
    void sendMessage({ text: question });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden />
          Ask about your report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {STARTER_QUESTIONS.map((question) => (
              <Button key={question} variant="outline" size="sm" onClick={() => ask(question)} disabled={busy}>
                {question}
              </Button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <ol className="space-y-3" aria-live="polite">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {message.role === "assistant" && <Bot className="mb-1 size-3.5 text-primary" aria-label="Assistant" />}
                {messageText(message)}
              </li>
            ))}
            {status === "submitted" && <li className="text-sm text-muted-foreground">Thinking…</li>}
          </ol>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {readableError(error)}
          </p>
        )}

        {limitReached ? (
          <p className="text-sm text-muted-foreground">Chat limit reached — start a new report to keep asking.</p>
        ) : (
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about your results"
              aria-label="Ask a question about your results"
              disabled={busy}
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send">
              <Send aria-hidden />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
