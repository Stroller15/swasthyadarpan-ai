"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Reading report", "Extracting values", "Explaining results"];
const STEP_MS = 2500;

// Steps advance on a timer while the single request runs; the last step holds until it finishes.
export function AnalysisProgress() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= STEPS.length - 1) return;
    const timer = setTimeout(() => setActive((i) => i + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8">
      <p className="text-center font-medium">Analyzing your report…</p>
      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className={cn("flex items-center gap-3 text-sm", i > active && "text-muted-foreground")}>
            {i < active ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : i === active ? (
              <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
            ) : (
              <span className="size-4 rounded-full border border-border" aria-hidden />
            )}
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
