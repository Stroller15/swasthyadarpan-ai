import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportChat, STARTER_QUESTIONS } from "@/components/report-chat";
import type { ReportAnalysis } from "@/lib/schema";
import cbc from "@/tests/fixtures/cbc.json";

const analysis = cbc as ReportAnalysis;
const REPLY = "Your hemoglobin is a little low.";

function streamedReply(text = REPLY) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "text-start", id: "t1" });
        writer.write({ type: "text-delta", id: "t1", delta: text });
        writer.write({ type: "text-end", id: "t1" });
      },
    }),
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("ReportChat", () => {
  it("offers the three starter questions", () => {
    render(<ReportChat analysis={analysis} />);
    expect(STARTER_QUESTIONS).toEqual([
      "What should I ask my doctor first?",
      "Explain my abnormal results simply",
      "Is anything here urgent?",
    ]);
    for (const q of STARTER_QUESTIONS) expect(screen.getByRole("button", { name: q })).toBeInTheDocument();
  });

  it("sends a starter question with the analysis and shows the reply", async () => {
    const fetchMock = vi.fn(async () => streamedReply());
    vi.stubGlobal("fetch", fetchMock);
    render(<ReportChat analysis={analysis} />);
    await userEvent.click(screen.getByRole("button", { name: "Is anything here urgent?" }));

    expect(await screen.findByText(REPLY)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/chat");
    const body = JSON.parse(String(init.body));
    expect(body.analysis.reportType).toBe("Complete Blood Count");
    expect(body.messages.at(-1).parts[0].text).toBe("Is anything here urgent?");
  });

  it("disables the input while a reply is streaming", async () => {
    let release!: () => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (release = () => resolve(streamedReply())))),
    );
    render(<ReportChat analysis={analysis} />);
    await userEvent.type(screen.getByRole("textbox"), "Hello{enter}");
    await waitFor(() => expect(screen.getByRole("textbox")).toBeDisabled());
    release();
    await waitFor(() => expect(screen.getByRole("textbox")).toBeEnabled());
  });

  it("stops accepting questions at the message limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => streamedReply()));
    render(<ReportChat analysis={analysis} maxMessages={2} />);
    await userEvent.type(screen.getByRole("textbox"), "Hello{enter}");
    expect(await screen.findByText("Chat limit reached — start a new report to keep asking.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the server's error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: { code: "RATE_LIMITED", message: "Hourly limit reached." } }, { status: 429 })),
    );
    render(<ReportChat analysis={analysis} />);
    await userEvent.type(screen.getByRole("textbox"), "Hello{enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Hourly limit reached.");
  });
});
