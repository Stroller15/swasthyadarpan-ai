import { Badge } from "@/components/ui/badge";
import type { Flag } from "@/lib/schema";
import { cn } from "@/lib/utils";

const FLAG_STYLES: Record<Flag, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-status-critical text-status-critical-foreground" },
  high: { label: "High", className: "bg-status-high text-status-high-foreground" },
  low: { label: "Low", className: "bg-status-low text-status-low-foreground" },
  normal: { label: "Normal", className: "bg-status-normal text-status-normal-foreground" },
  unknown: { label: "No range", className: "bg-muted text-muted-foreground" },
};

export function FlagBadge({ flag }: { flag: Flag }) {
  const { label, className } = FLAG_STYLES[flag];
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}
