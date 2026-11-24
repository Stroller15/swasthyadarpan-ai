import type { ReportAnalysis } from "@/lib/schema";
import { cn } from "@/lib/utils";

function Section({ title, items, numbered, className }: { title: string; items: string[]; numbered?: boolean; className?: string }) {
  const List = numbered ? "ol" : "ul";
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <h3 className="text-sm font-medium">{title}</h3>
      <List className="mt-3 space-y-2.5 text-sm leading-relaxed">
        {items.map((item, i) => (
          <li key={item} className="flex gap-3">
            <span className="w-4 shrink-0 text-muted-foreground tabular-nums" aria-hidden>
              {numbered ? i + 1 : "–"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </List>
    </section>
  );
}

export function FindingsList({ analysis }: { analysis: ReportAnalysis }) {
  const { keyFindings, questionsForDoctor, generalTips } = analysis;
  const side = [
    questionsForDoctor.length > 0 && <Section key="q" title="Questions for your doctor" items={questionsForDoctor} numbered />,
    generalTips.length > 0 && <Section key="t" title="General tips" items={generalTips} />,
  ].filter(Boolean);

  if (keyFindings.length === 0 && side.length === 0) return null;

  return (
    <div className={cn("grid items-start gap-4", keyFindings.length > 0 && side.length > 0 && "lg:grid-cols-[3fr_2fr]")}>
      {keyFindings.length > 0 && <Section title="Key findings" items={keyFindings} className="text-[15px]" />}
      {side.length > 0 && <div className="grid content-start gap-4">{side}</div>}
    </div>
  );
}
