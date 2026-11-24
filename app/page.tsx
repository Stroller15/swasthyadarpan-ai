import { Activity } from "lucide-react";
import { Disclaimer } from "@/components/disclaimer";
import { ReportExplainer } from "@/components/report-explainer";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-6">
          <Activity className="size-[18px] text-primary" strokeWidth={2} aria-hidden />
          <span className="font-medium">SwasthyaDarpan</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-12 pb-20 sm:pt-16 lg:pt-20">
        <ReportExplainer />
      </main>
      <Disclaimer />
    </div>
  );
}
