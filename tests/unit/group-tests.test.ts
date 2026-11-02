import { describe, expect, it } from "vitest";
import { groupTests } from "@/lib/group-tests";
import type { TestResult } from "@/lib/schema";
import cbc from "@/tests/fixtures/cbc.json";

const t = (name: string, flag: TestResult["flag"], category?: string): TestResult => ({
  name,
  value: "1",
  flag,
  explanation: "x",
  category,
});

describe("groupTests", () => {
  it("puts the group with an abnormal result first, abnormal rows first", () => {
    const groups = groupTests(cbc.tests as TestResult[]);
    expect(groups[0].category).toBe("Red blood cells");
    expect(groups[0].tests[0].name).toBe("Hemoglobin");
  });

  it("moves abnormal groups ahead of normal ones", () => {
    const groups = groupTests([t("A", "normal", "One"), t("B", "high", "Two")]);
    expect(groups.map((g) => g.category)).toEqual(["Two", "One"]);
  });

  it("files tests without a category under Other", () => {
    expect(groupTests([t("A", "normal")])[0].category).toBe("Other");
  });

  it("keeps the original order of normal rows", () => {
    const groups = groupTests([t("A", "normal", "X"), t("B", "low", "X"), t("C", "normal", "X")]);
    expect(groups[0].tests.map((x) => x.name)).toEqual(["B", "A", "C"]);
  });
});
