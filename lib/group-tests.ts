import type { Flag, TestResult } from "@/lib/schema";

const ABNORMAL: Flag[] = ["low", "high", "critical"];

export const isAbnormal = (test: TestResult) => ABNORMAL.includes(test.flag);

/** Groups tests by category; groups and rows with abnormal results come first, otherwise printed order is kept. */
export function groupTests(tests: TestResult[]): { category: string; tests: TestResult[] }[] {
  const groups = new Map<string, TestResult[]>();
  for (const test of tests) {
    const category = test.category?.trim() || "Other";
    groups.set(category, [...(groups.get(category) ?? []), test]);
  }
  const abnormalFirst = <T>(items: T[], abnormal: (item: T) => boolean) =>
    [...items].sort((a, b) => Number(abnormal(b)) - Number(abnormal(a)));

  return abnormalFirst(
    [...groups].map(([category, rows]) => ({ category, tests: abnormalFirst(rows, isAbnormal) })),
    (group) => group.tests.some(isAbnormal),
  );
}
