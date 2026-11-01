import { HeartPulse, Lightbulb, MessageCircleQuestion } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportAnalysis } from "@/lib/schema";

export function FindingsList({ analysis }: { analysis: ReportAnalysis }) {
  const sections = [
    { title: "Key findings", items: analysis.keyFindings, Icon: HeartPulse },
    { title: "Questions for your doctor", items: analysis.questionsForDoctor, Icon: MessageCircleQuestion },
    { title: "General tips", items: analysis.generalTips, Icon: Lightbulb },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sections.map(({ title, items, Icon }) => (
        <Card key={title} size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Icon className="size-4 text-primary" aria-hidden />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed marker:text-muted-foreground">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
