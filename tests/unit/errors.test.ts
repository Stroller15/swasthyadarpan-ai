import { APICallError, RetryError } from "ai";
import { describe, expect, it, vi } from "vitest";
import { AppError, errorResponse, toAppError } from "@/lib/errors";

describe("toAppError", () => {
  it("returns an AppError unchanged", () => {
    const err = new AppError("RATE_LIMITED");
    expect(toAppError(err)).toBe(err);
  });

  it("maps a provider 429 to QUOTA_EXCEEDED", () => {
    const providerError = Object.assign(new Error("Resource exhausted"), { statusCode: 429 });
    const err = toAppError(providerError);
    expect(err.code).toBe("QUOTA_EXCEEDED");
    expect(err.status).toBe(503);
    expect(err.message).toBe("The free demo has hit today's limit — try a sample later.");
  });

  it("maps anything else to ANALYSIS_FAILED without leaking the original message", () => {
    const err = toAppError(new Error("secret internal detail"));
    expect(err.code).toBe("ANALYSIS_FAILED");
    expect(err.message).not.toContain("secret");
  });
});

describe("errorResponse", () => {
  it("returns the error as JSON with its status", async () => {
    const res = errorResponse(new AppError("FILE_TOO_LARGE"));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error.code).toBe("FILE_TOO_LARGE");
    expect(typeof body.error.message).toBe("string");
  });

  it("uses a custom message when given one", async () => {
    const res = errorResponse(new AppError("NOT_MEDICAL_REPORT", "This looks like a bill."));
    expect(res.status).toBe(422);
    expect((await res.json()).error.message).toBe("This looks like a bill.");
  });
});

describe("toAppError with real AI SDK errors", () => {
  const quotaError = () =>
    new APICallError({ message: "Resource exhausted", url: "https://x", requestBodyValues: {}, statusCode: 429 });

  it("maps an APICallError 429 to QUOTA_EXCEEDED", () => {
    expect(toAppError(quotaError()).code).toBe("QUOTA_EXCEEDED");
  });

  it("unwraps a RetryError whose last attempt hit the quota", () => {
    const err = new RetryError({ message: "Failed after 2 attempts", reason: "maxRetriesExceeded", errors: [quotaError(), quotaError()] });
    expect(toAppError(err).code).toBe("QUOTA_EXCEEDED");
  });
});

describe("errorResponse logging", () => {
  it("logs unexpected errors by name without their message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorResponse(new TypeError("patient name: Aarav"));
    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.stringify(spy.mock.calls[0]);
    expect(logged).toContain("TypeError");
    expect(logged).not.toContain("Aarav");
    spy.mockRestore();
  });

  it("does not log expected AppErrors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorResponse(new AppError("RATE_LIMITED"));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
