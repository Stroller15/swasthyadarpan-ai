import { Badge } from "@/components/ui/badge";
import type { Flag } from "@/lib/schema";
import { cn } from "@/lib/utils";

const LABELS: Record<Flag, string> = {
  critical: "Critical",
  high: "High",
  low: "Low",
  normal: "Normal",
  unknown: "No range",
};

// Only results outside the range get color, so the ones that matter stand out.
const COLORED: Partial<Record<Flag, string>> = {
  critical: "bg-status-critical text-status-critical-foreground",
  high: "bg-status-high text-status-high-foreground",
  low: "bg-status-low text-status-low-foreground",
};

export function FlagBadge({ flag }: { flag: Flag }) {
  const colored = COLORED[flag];
  if (!colored) return <span className="text-xs text-muted-foreground">{LABELS[flag]}</span>;
  return <Badge className={cn("rounded-md font-medium", colored)}>{LABELS[flag]}</Badge>;
}
