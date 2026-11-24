import { describe, expect, it } from "vitest";
import { rangeScale } from "@/components/range-bar";

const range = (low: number | undefined, high: number | undefined, text: string) => ({ low, high, text });

describe("rangeScale", () => {
  it("puts a low value left of the normal band", () => {
    const scale = rangeScale({ value: "10.8", referenceRange: range(13, 17, "13 - 17") })!;
    expect(scale.marker).toBeLessThan(scale.band[0]);
    expect(scale.band[1]).toBeGreaterThan(scale.band[0]);
  });

  it("puts a normal value inside the band", () => {
    const scale = rangeScale({ value: "7,200", referenceRange: range(4000, 11000, "4,000 - 11,000") })!;
    expect(scale.marker).toBeGreaterThan(scale.band[0]);
    expect(scale.marker).toBeLessThan(scale.band[1]);
  });

  it("runs an upper-only band from the left edge", () => {
    const scale = rangeScale({ value: "240", referenceRange: range(undefined, undefined, "< 200") })!;
    expect(scale.band[0]).toBe(0);
    expect(scale.marker).toBeGreaterThan(scale.band[1]);
  });

  it("returns null for text values or missing ranges", () => {
    expect(rangeScale({ value: "Negative", referenceRange: range(0, 1, "0 - 1") })).toBeNull();
    expect(rangeScale({ value: "4.2" })).toBeNull();
  });
});
