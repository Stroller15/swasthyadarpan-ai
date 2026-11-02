import { CalendarDays, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReportAnalysis, Urgency } from "@/lib/schema";
import { cn } from "@/lib/utils";

const URGENCY: Record<Urgency, { label: string; className: string }> = {
  routine: { label: "Routine", className: "bg-emerald-100 text-emerald-800" },
  soon: { label: "See a doctor soon", className: "bg-amber-100 text-amber-800" },
  urgent: { label: "Seek care promptly", className: "bg-red-600 text-white" },
};

export function SummaryCard({ analysis }: { analysis: ReportAnalysis }) {
  const urgency = URGENCY[analysis.urgency];
  const patient = analysis.patient;
  const patientLine = [patient?.name, patient?.age && `${patient.age} y`, patient?.sex].filter(Boolean).join(" · ");

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{analysis.reportType}</h2>
          <Badge className={cn("font-medium", urgency.className)}>{urgency.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {patientLine && (
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" aria-hidden />
              {patientLine}
            </span>
          )}
          {analysis.reportDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {analysis.reportDate}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed">{analysis.summary}</p>
      </CardContent>
    </Card>
  );
}
