import { Badge } from "@/components/ui/badge";
import type { Flag } from "@/lib/schema";
import { cn } from "@/lib/utils";

const FLAG_STYLES: Record<Flag, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-600 text-white" },
  high: { label: "High", className: "bg-red-100 text-red-800" },
  low: { label: "Low", className: "bg-amber-100 text-amber-800" },
  normal: { label: "Normal", className: "bg-emerald-100 text-emerald-800" },
  unknown: { label: "No range", className: "bg-muted text-muted-foreground" },
};

export function FlagBadge({ flag }: { flag: Flag }) {
  const { label, className } = FLAG_STYLES[flag];
  return <Badge className={cn("font-medium", className)}>{label}</Badge>;
}
