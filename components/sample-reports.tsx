import { ArrowRight } from "lucide-react";
import { SAMPLES, type SampleReport } from "@/lib/samples";
import { cn } from "@/lib/utils";

const DOT: Record<SampleReport["tone"], string> = {
  low: "bg-status-low-foreground",
  high: "bg-status-high-foreground",
  normal: "bg-status-normal-foreground",
};

export function SampleReports({ onSelect, disabled }: { onSelect: (path: string) => void; disabled?: boolean }) {
  return (
    <section aria-labelledby="samples-heading" className="space-y-3">
      <h2 id="samples-heading" className="text-sm text-muted-foreground">
        No report handy? Try a sample with a fictitious patient
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sample.path)}
            className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset disabled:opacity-60"
          >
            <span className="min-w-0 flex-1 text-sm font-medium">{sample.label}</span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", DOT[sample.tone])} aria-hidden />
              {sample.description}
            </span>
            <ArrowRight
              className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        ))}
      </div>
    </section>
  );
}
