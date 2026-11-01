import type { Flag, TestResult } from "@/lib/schema";

type Bounds = { low?: number; high?: number };

const NUMBER = String.raw`(\d+(?:\.\d+)?)`;
const TRAILING_TEXT = String.raw`\s*[^\d]*$`;
const BETWEEN = new RegExp(String.raw`^${NUMBER}\s*(?:-|to)\s*${NUMBER}${TRAILING_TEXT}`, "i");
const UPPER_ONLY = new RegExp(String.raw`^(?:<=?|≤|up\s*to|below|less\s+than)\s*${NUMBER}${TRAILING_TEXT}`, "i");
const LOWER_ONLY = new RegExp(String.raw`^(?:>=?|≥|above|more\s+than|greater\s+than)\s*${NUMBER}${TRAILING_TEXT}`, "i");

/** Reads a printed result as a number. Returns null for text and for values with a comparator ("<0.5"). */
export function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim().replace(/\s*(?:HH|LL|H|L|\*)$/i, "");
  return /^\d+(?:\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
}

/** Extracts numeric bounds from a printed range such as "13 - 17", "< 200" or "up to 40". */
export function parseRangeText(text: string): Bounds {
  const cleaned = text.replace(/,/g, "").replace(/[–—]/g, "-").trim();
  let match = cleaned.match(BETWEEN);
  if (match) return { low: Number(match[1]), high: Number(match[2]) };
  match = cleaned.match(UPPER_ONLY);
  if (match) return { high: Number(match[1]) };
  match = cleaned.match(LOWER_ONLY);
  if (match) return { low: Number(match[1]) };
  return {};
}

function boundsFor(test: TestResult): Bounds {
  const range = test.referenceRange;
  if (!range) return {};
  if (range.low !== undefined || range.high !== undefined) {
    return { low: range.low, high: range.high };
  }
  return parseRangeText(range.text);
}

/**
 * Re-checks the model's flag against the reference range. Code wins whenever
 * it can decide; otherwise the model's flag stands.
 */
export function reconcileFlag(test: TestResult): Flag {
  const value = parseNumericValue(test.value);
  const { low, high } = boundsFor(test);
  if (value === null || (low === undefined && high === undefined)) return test.flag;

  const computed: Flag =
    low !== undefined && value < low ? "low" : high !== undefined && value > high ? "high" : "normal";

  if (test.flag === "critical" && computed !== "normal") return "critical";
  return computed;
}

export function reconcileFlags(tests: TestResult[]): TestResult[] {
  return tests.map((test) => ({ ...test, flag: reconcileFlag(test) }));
}
