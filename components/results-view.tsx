import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { FindingsList } from "@/components/findings-list";
import { SummaryCard } from "@/components/summary-card";
import { TestResultsTable } from "@/components/test-results-table";
import { Button } from "@/components/ui/button";
import type { ReportAnalysis } from "@/lib/schema";

export function ResultsView({
  analysis,
  onReset,
  chatSlot,
}: {
  analysis: ReportAnalysis;
  onReset: () => void;
  chatSlot?: ReactNode;
}) {
  return (
    <div className="space-y-10 duration-500 ease-out-soft animate-in fade-in slide-in-from-bottom-2">
      <SummaryCard
        analysis={analysis}
        action={
          <Button variant="outline" onClick={onReset}>
            <RotateCcw aria-hidden className="text-muted-foreground" />
            Analyze another report
          </Button>
        }
      />
      <section aria-labelledby="results-heading" className="space-y-3">
        <h2 id="results-heading" className="text-base font-medium">
          Your results
        </h2>
        {analysis.tests.length > 0 ? (
          <TestResultsTable tests={analysis.tests} />
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            This report has no lab values to tabulate.
          </p>
        )}
      </section>
      <FindingsList analysis={analysis} />
      {chatSlot}
    </div>
  );
}
