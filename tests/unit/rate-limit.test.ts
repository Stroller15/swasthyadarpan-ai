import { describe, expect, it } from "vitest";
import { clientKey, createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  const setup = () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, now: () => now });
    return { limiter, advance: (ms: number) => (now += ms) };
  };

  it("allows the limit and rejects the next request", () => {
    const { limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.check("a");
    expect(() => limiter.check("a")).toThrow(expect.objectContaining({ code: "RATE_LIMITED" }));
  });

  it("resets after the window", () => {
    const { limiter, advance } = setup();
    for (let i = 0; i < 5; i++) limiter.check("a");
    advance(60_000);
    expect(() => limiter.check("a")).not.toThrow();
  });

  it("tracks keys independently", () => {
    const { limiter } = setup();
    for (let i = 0; i < 5; i++) limiter.check("a");
    expect(() => limiter.check("b")).not.toThrow();
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) => new Request("http://x/api", { headers });

  it("uses the first x-forwarded-for address", () => {
    expect(clientKey(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("falls back to x-real-ip", () => {
    expect(clientKey(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });
  it("falls back to anonymous", () => {
    expect(clientKey(req({}))).toBe("anonymous");
  });
});
