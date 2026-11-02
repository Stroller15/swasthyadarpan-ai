import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReportAnalysis } from "@/lib/use-report-analysis";
import cbc from "@/tests/fixtures/cbc.json";

const pdf = () => new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "r.pdf", { type: "application/pdf" });
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("useReportAnalysis", () => {
  it("moves from idle through analyzing to result", async () => {
    let resolve!: (r: Response) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (resolve = r))));
    const { result } = renderHook(() => useReportAnalysis());
    expect(result.current.state.status).toBe("idle");

    act(() => void result.current.analyzeFile(pdf()));
    expect(result.current.state.status).toBe("analyzing");

    await act(async () => resolve(jsonResponse({ analysis: cbc })));
    await waitFor(() => expect(result.current.state.status).toBe("result"));
    const state = result.current.state;
    expect(state.status === "result" && state.analysis.reportType).toBe("Complete Blood Count");
  });

  it("surfaces the server's error code and message", async () => {
    const message = "The free demo has hit today's limit — try a sample later.";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "QUOTA_EXCEEDED", message } }, 503)));
    const { result } = renderHook(() => useReportAnalysis());
    await act(() => result.current.analyzeFile(pdf()));
    expect(result.current.state).toEqual({ status: "error", code: "QUOTA_EXCEEDED", message });
  });

  it("maps a network failure to ANALYSIS_FAILED", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const { result } = renderHook(() => useReportAnalysis());
    await act(() => result.current.analyzeFile(pdf()));
    expect(result.current.state).toMatchObject({ status: "error", code: "ANALYSIS_FAILED" });
  });

  it("analyzes a sample by fetching its PDF first", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url === "/samples/cbc.pdf" ? new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46])) : jsonResponse({ analysis: cbc }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useReportAnalysis());
    await act(() => result.current.analyzeSample("/samples/cbc.pdf"));
    expect(fetchMock).toHaveBeenCalledWith("/samples/cbc.pdf");
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", expect.objectContaining({ method: "POST" }));
    expect(result.current.state.status).toBe("result");
  });

  it("retries the last file", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse({ analysis: cbc }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useReportAnalysis());
    await act(() => result.current.analyzeFile(pdf()));
    await act(() => result.current.retry());
    expect(result.current.state.status).toBe("result");
  });

  it("reset returns to idle", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ analysis: cbc })));
    const { result } = renderHook(() => useReportAnalysis());
    await act(() => result.current.analyzeFile(pdf()));
    act(() => result.current.reset());
    expect(result.current.state.status).toBe("idle");
  });
});
