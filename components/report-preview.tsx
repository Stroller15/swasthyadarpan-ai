import { FlagBadge } from "@/components/flag-badge";
import { RangeBar } from "@/components/range-bar";
import type { TestResult } from "@/lib/schema";

// Rows from the bundled CBC sample (a fictitious patient), so the preview matches what the sample returns.
const ROWS: TestResult[] = [
  {
    name: "Hemoglobin",
    value: "10.8",
    unit: "g/dL",
    referenceRange: { low: 13, high: 17, text: "13 - 17" },
    flag: "low",
    explanation: "Hemoglobin carries oxygen in your blood; yours is below the usual range.",
  },
  {
    name: "RBC count",
    value: "4.7",
    unit: "million/µL",
    referenceRange: { low: 4.5, high: 5.5, text: "4.5 - 5.5" },
    flag: "normal",
    explanation: "",
  },
  {
    name: "WBC count",
    value: "7,200",
    unit: "/µL",
    referenceRange: { low: 4000, high: 11000, text: "4,000 - 11,000" },
    flag: "normal",
    explanation: "",
  },
  {
    name: "Platelet count",
    value: "2.6",
    unit: "lakh/µL",
    referenceRange: { low: 1.5, high: 4.5, text: "1.5 - 4.5" },
    flag: "normal",
    explanation: "",
  },
];

/** A static example of the results screen, shown next to the upload so people see what they'll get. */
export function ReportPreview() {
  return (
    <figure
      aria-label="Example of an explained blood count report"
      className="rounded-2xl border border-border bg-card p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.08)] dark:shadow-none"
    >
      <div className="flex items-baseline justify-between gap-4 px-4 pt-4 pb-3">
        <div>
          <p className="font-medium">Complete Blood Count</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Sample report · Aarav Mehta · 34 y</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">1 of 7 outside range</span>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-background/60">
        {ROWS.map((row) => (
          <div key={row.name} className="px-4 py-3">
            <div className="grid grid-cols-[1fr_auto_88px_56px] items-center gap-4">
              <span className="truncate text-sm font-medium">{row.name}</span>
              <span className="text-sm tabular-nums">
                <span className="font-medium">{row.value}</span>
                <span className="ml-1 text-xs text-muted-foreground">{row.unit}</span>
              </span>
              <RangeBar test={row} />
              <span className="text-right">
                <FlagBadge flag={row.flag} />
              </span>
            </div>
            {row.explanation && (
              <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-muted-foreground">{row.explanation}</p>
            )}
          </div>
        ))}
      </div>
      <figcaption className="px-4 pt-3 pb-2 text-xs text-muted-foreground">
        The shaded band is the normal range, the tick is your value
      </figcaption>
    </figure>
  );
}
