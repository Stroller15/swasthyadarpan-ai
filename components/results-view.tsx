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
    <div className="space-y-6">
      <SummaryCard analysis={analysis} />
      <section aria-labelledby="results-heading" className="space-y-3">
        <h2 id="results-heading" className="text-lg font-semibold tracking-tight">
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
      <Button variant="outline" onClick={onReset}>
        <RotateCcw aria-hidden />
        Analyze another report
      </Button>
    </div>
  );
}
