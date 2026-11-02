import { describe, expect, it } from "vitest";
import { deriveUrgency, parseNumericValue, parseRangeText, reconcileFlag, reconcileFlags } from "@/lib/flags";
import type { TestResult } from "@/lib/schema";

const t = (over: Partial<TestResult>): TestResult => ({
  name: "Hemoglobin",
  value: "10.8",
  flag: "normal",
  explanation: "x",
  referenceRange: { low: 13, high: 17, text: "13 - 17" },
  ...over,
});

describe("parseNumericValue", () => {
  it.each([
    ["13.2", 13.2],
    ["1,250", 1250],
    ["12.5 H", 12.5],
    ["9.1 L", 9.1],
    ["12,5", 12.5],
    ["1,250.5", 1250.5],
    ["<0.5", null],
    [">90", null],
    ["Negative", null],
    ["", null],
  ])("%s → %s", (input, expected) => {
    expect(parseNumericValue(input)).toBe(expected);
  });
});

describe("parseRangeText", () => {
  it.each([
    ["13 - 17", { low: 13, high: 17 }],
    ["13–17", { low: 13, high: 17 }],
    ["4,000 - 11,000", { low: 4000, high: 11000 }],
    ["< 200", { high: 200 }],
    ["≤5.6", { high: 5.6 }],
    ["> 40", { low: 40 }],
    ["up to 40", { high: 40 }],
    ["Negative", {}],
  ])("%s", (input, expected) => {
    expect(parseRangeText(input)).toEqual(expected);
  });
});

describe("reconcileFlag", () => {
  it("overrides the model when the value is below range", () => {
    expect(reconcileFlag(t({ value: "10.8", flag: "normal" }))).toBe("low");
  });
  it("flags values above range as high", () => {
    expect(reconcileFlag(t({ value: "18" }))).toBe("high");
  });
  it("treats boundary values as normal", () => {
    expect(reconcileFlag(t({ value: "13", flag: "low" }))).toBe("normal");
    expect(reconcileFlag(t({ value: "17", flag: "high" }))).toBe("normal");
  });
  it("falls back to the range text when there are no numeric bounds", () => {
    expect(reconcileFlag(t({ value: "240", flag: "normal", referenceRange: { text: "< 200" } }))).toBe("high");
  });
  it("keeps critical when the code agrees the value is out of range", () => {
    expect(reconcileFlag(t({ value: "10.8", flag: "critical" }))).toBe("critical");
  });
  it("downgrades critical when the value is in range", () => {
    expect(reconcileFlag(t({ value: "15", flag: "critical" }))).toBe("normal");
  });
  it("keeps the model's flag when the value has a comparator", () => {
    expect(reconcileFlag(t({ value: "<0.5", flag: "high" }))).toBe("high");
  });
  it("keeps the model's flag for text values without a range", () => {
    expect(reconcileFlag(t({ value: "Normal", flag: "normal", referenceRange: undefined }))).toBe("normal");
  });
});

describe("reconcileFlags", () => {
  it("returns copies with reconciled flags", () => {
    const input = [t({ value: "10.8", flag: "normal" })];
    const out = reconcileFlags(input);
    expect(out[0].flag).toBe("low");
    expect(input[0].flag).toBe("normal");
  });
});

describe("deriveUrgency", () => {
  it("raises routine to soon when a reconciled test is abnormal", () => {
    expect(deriveUrgency([t({ flag: "low" })], "routine")).toBe("soon");
  });
  it("raises anything to urgent when a test is critical", () => {
    expect(deriveUrgency([t({ flag: "critical" })], "soon")).toBe("urgent");
  });
  it("never lowers the model's urgency", () => {
    expect(deriveUrgency([t({ flag: "normal" })], "urgent")).toBe("urgent");
  });
  it("keeps routine when everything is normal", () => {
    expect(deriveUrgency([t({ flag: "normal" })], "routine")).toBe("routine");
  });
});
