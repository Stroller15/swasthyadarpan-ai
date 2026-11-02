// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cbc from "@/tests/fixtures/cbc.json";

const PDF_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31];

function uploadRequest(bytes: number[] | null, ip = "10.0.0.1") {
  const form = new FormData();
  if (bytes) form.append("file", new File([new Uint8Array(bytes)], "report.pdf", { type: "application/pdf" }));
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: form,
    headers: { "x-forwarded-for": ip },
  });
}

async function loadRoute() {
  return import("@/app/api/analyze/route");
}

describe("POST /api/analyze", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("AI_MOCK", "1");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/lib/ai/analyze");
  });

  it("returns the analysis for a valid PDF", async () => {
    const { POST } = await loadRoute();
    const res = await POST(uploadRequest(PDF_BYTES));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.analysis.reportType).toBe(cbc.reportType);
  });

  it("rejects a request without a file", async () => {
    const { POST } = await loadRoute();
    const res = await POST(uploadRequest(null));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_FILE");
  });

  it("rejects a text file", async () => {
    const { POST } = await loadRoute();
    const res = await POST(uploadRequest([...new TextEncoder().encode("hello")]));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_FILE");
  });

  it("rate limits the sixth request from one IP", async () => {
    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) expect((await POST(uploadRequest(PDF_BYTES, "10.0.0.9"))).status).toBe(200);
    const res = await POST(uploadRequest(PDF_BYTES, "10.0.0.9"));
    expect(res.status).toBe(429);
    expect((await res.json()).error.code).toBe("RATE_LIMITED");
  });

  it("maps a provider quota error to QUOTA_EXCEEDED", async () => {
    vi.doMock("@/lib/ai/analyze", () => ({
      analyzeReport: vi.fn().mockRejectedValue(Object.assign(new Error("exhausted"), { statusCode: 429 })),
    }));
    const { POST } = await loadRoute();
    const res = await POST(uploadRequest(PDF_BYTES));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("QUOTA_EXCEEDED");
  });
});
