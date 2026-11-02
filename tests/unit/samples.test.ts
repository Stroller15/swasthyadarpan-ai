// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SAMPLES } from "@/lib/samples";

describe("SAMPLES", () => {
  it("lists the three sample reports", () => {
    expect(SAMPLES.map((s) => s.label)).toEqual(["Blood count (CBC)", "Cholesterol panel", "Thyroid panel"]);
  });

  it.each(SAMPLES)("$id points to a real PDF", (sample) => {
    const bytes = readFileSync(join(process.cwd(), "public", sample.path));
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
