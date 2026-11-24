import { boundsFor, parseNumericValue } from "@/lib/flags";
import type { Flag, TestResult } from "@/lib/schema";
import { cn } from "@/lib/utils";

const MARKER: Record<Flag, string> = {
  low: "bg-status-low-foreground",
  high: "bg-status-high-foreground",
  critical: "bg-status-critical",
  normal: "bg-foreground",
  unknown: "bg-muted-foreground",
};

type Scale = { band: [number, number]; marker: number };

/** Places the normal band and the value on one track, as percentages. Null when either can't be read. */
export function rangeScale(test: Pick<TestResult, "value" | "referenceRange">): Scale | null {
  const value = parseNumericValue(test.value);
  const { low, high } = boundsFor(test as TestResult);
  if (value === null || (low === undefined && high === undefined)) return null;

  // One-sided ranges ("< 200", "> 40") get a band that runs to the edge of the track.
  const bandLow = low ?? 0;
  const bandHigh = high ?? Math.max(bandLow * 2, value * 1.25);
  const span = bandHigh - bandLow || Math.abs(bandHigh) || 1;
  const min = Math.min(low === undefined ? 0 : bandLow - span * 0.6, value - span * 0.15);
  const max = Math.max(high === undefined ? bandHigh : bandHigh + span * 0.6, value + span * 0.15);
  const pct = (n: number) => Math.min(100, Math.max(0, ((n - min) / (max - min)) * 100));

  return {
    band: [pct(bandLow), high === undefined ? 100 : pct(bandHigh)],
    marker: pct(value),
  };
}

/** A thin track with the normal range shaded and a tick where this result falls. */
export function RangeBar({ test, className }: { test: TestResult; className?: string }) {
  const scale = rangeScale(test);
  if (!scale) return null;
  const [from, to] = scale.band;

  return (
    <div aria-hidden className={cn("relative h-3 w-full", className)} data-testid="range-bar">
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-range-track" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-range-band"
        style={{ left: `${from}%`, width: `${to - from}%` }}
      />
      <div
        className={cn("absolute top-0 h-3 w-0.5 -translate-x-1/2 rounded-full ring-2 ring-card", MARKER[test.flag])}
        style={{ left: `${scale.marker}%` }}
      />
    </div>
  );
}
