import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ReportAnalysisSchema } from "@/lib/schema";

const fixturesDir = join(process.cwd(), "tests/fixtures");
const loadFixture = (name: string) =>
  JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));

describe("ReportAnalysisSchema", () => {
  it("accepts every fixture", () => {
    const files = readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const file of files) {
      expect(() => ReportAnalysisSchema.parse(loadFixture(file)), file).not.toThrow();
    }
  });

  it("rejects an unknown flag", () => {
    const cbc = loadFixture("cbc.json");
    cbc.tests[0].flag = "elevated";
    expect(ReportAnalysisSchema.safeParse(cbc).success).toBe(false);
  });

  it("allows a test with only name, value, flag, explanation", () => {
    const cbc = loadFixture("cbc.json");
    cbc.tests = [{ name: "Urine colour", value: "Pale yellow", flag: "normal", explanation: "Looks typical." }];
    expect(ReportAnalysisSchema.safeParse(cbc).success).toBe(true);
  });
});
