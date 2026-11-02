import { Activity } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { ReportExplainer } from "@/components/report-explainer";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <>
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-2">
          <Activity className="size-5 text-primary" aria-hidden />
          <span className="font-semibold tracking-tight">SwasthyaDarpan</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-8 px-4 pt-10 pb-24">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Understand your lab report in plain language
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Upload a blood test or diagnostic report. Every value is explained simply, abnormal results are flagged,
            and you can ask follow-up questions.
          </p>
        </div>
        <ReportExplainer />
      </main>
      <Disclaimer />
    </>
  );
}
