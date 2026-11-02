import { FileText } from "lucide-react";
import { SAMPLES } from "@/lib/samples";

export function SampleReports({ onSelect, disabled }: { onSelect: (path: string) => void; disabled?: boolean }) {
  return (
    <section aria-labelledby="samples-heading" className="space-y-3">
      <h2 id="samples-heading" className="text-sm font-medium text-muted-foreground">
        No report handy? Try a sample (fictitious patients):
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(sample.path)}
            className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
          >
            <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block font-medium">{sample.label}</span>
              <span className="block text-sm text-muted-foreground">{sample.description}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
