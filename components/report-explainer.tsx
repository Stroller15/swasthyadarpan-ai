"use client";

import { ShieldCheck } from "lucide-react";
import { AnalysisProgress } from "@/components/analysis-progress";
import { ErrorState } from "@/components/error-state";
import { ResultsView } from "@/components/results-view";
import { SampleReports } from "@/components/sample-reports";
import { UploadPanel } from "@/components/upload-panel";
import { useReportAnalysis } from "@/lib/use-report-analysis";

export function ReportExplainer() {
  const { state, analyzeFile, analyzeSample, retry, reset } = useReportAnalysis();

  switch (state.status) {
    case "idle":
      return (
        <div className="space-y-8">
          <UploadPanel onFile={analyzeFile} />
          <SampleReports onSelect={analyzeSample} />
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Nothing is stored. Your file is sent to Google Gemini for analysis, and Google&apos;s free tier may use
            inputs to improve its products, so the samples are a good way to try it.
          </p>
        </div>
      );
    case "analyzing":
      return <AnalysisProgress />;
    case "error":
      return <ErrorState code={state.code} message={state.message} onRetry={retry} onReset={reset} />;
    case "result":
      return <ResultsView analysis={state.analysis} onReset={reset} />;
  }
}
