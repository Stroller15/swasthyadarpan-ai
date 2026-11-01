import { describe, expect, it } from "vitest";
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
