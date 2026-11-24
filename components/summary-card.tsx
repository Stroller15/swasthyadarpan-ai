import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { isAbnormal } from "@/lib/group-tests";
import type { ReportAnalysis, Urgency } from "@/lib/schema";
import { cn } from "@/lib/utils";

const URGENCY: Record<Urgency, { label: string; className: string }> = {
  routine: { label: "Routine", className: "bg-status-normal text-status-normal-foreground" },
  soon: { label: "See a doctor soon", className: "bg-status-low text-status-low-foreground" },
  urgent: { label: "Seek care promptly", className: "bg-status-critical text-status-critical-foreground" },
};

function outsideRangeLine(analysis: ReportAnalysis): string | null {
  const total = analysis.tests.length;
  if (total === 0) return null;
  const outside = analysis.tests.filter(isAbnormal).length;
  if (outside === 0) return `All ${total} results within the normal range`;
  return `${outside} of ${total} results outside the normal range`;
}

export function SummaryCard({ analysis, action }: { analysis: ReportAnalysis; action?: ReactNode }) {
  const urgency = URGENCY[analysis.urgency];
  const patient = analysis.patient;
  const meta = [patient?.name, patient?.age && `${patient.age} y`, patient?.sex, analysis.reportDate]
    .filter(Boolean)
    .join(" · ");
  const outside = outsideRangeLine(analysis);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">{analysis.reportType}</h2>
          {meta && <p className="text-sm text-muted-foreground tabular-nums">{meta}</p>}
        </div>
        {action}
      </div>
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge className={cn("rounded-md font-medium", urgency.className)}>{urgency.label}</Badge>
          {outside && <span className="text-sm text-muted-foreground tabular-nums">{outside}</span>}
        </div>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed">{analysis.summary}</p>
      </div>
    </section>
  );
}
