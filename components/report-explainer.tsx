"use client";

import { AnalysisProgress } from "@/components/analysis-progress";
import { ErrorState } from "@/components/error-state";
import { ReportChat } from "@/components/report-chat";
import { ReportPreview } from "@/components/report-preview";
import { ResultsView } from "@/components/results-view";
import { SampleReports } from "@/components/sample-reports";
import { UploadPanel } from "@/components/upload-panel";
import { useReportAnalysis } from "@/lib/use-report-analysis";

export function ReportExplainer() {
  const { state, analyzeFile, analyzeSample, retry, reset } = useReportAnalysis();

  switch (state.status) {
    case "idle":
      return (
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl leading-[1.08] font-medium tracking-[-0.02em] text-balance sm:text-5xl">
                Understand your lab report in plain language
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Upload a blood test or diagnostic report. Every value is explained simply, abnormal results are
                flagged, and you can ask follow-up questions.
              </p>
            </div>
            <UploadPanel onFile={analyzeFile} />
            <SampleReports onSelect={analyzeSample} />
            <p className="max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              Nothing is stored. Your file is sent to Google Gemini for analysis, and Google&apos;s free tier may use
              inputs to improve its products, so the samples are a good way to try it.
            </p>
          </div>
          <div className="hidden lg:block">
            <ReportPreview />
          </div>
        </div>
      );
    case "analyzing":
      return <AnalysisProgress />;
    case "error":
      return <ErrorState code={state.code} message={state.message} onRetry={retry} onReset={reset} />;
    case "result":
      return (
        <ResultsView
          analysis={state.analysis}
          onReset={reset}
          chatSlot={<ReportChat analysis={state.analysis} />}
        />
      );
  }
}
