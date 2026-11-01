import { FlagBadge } from "@/components/flag-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { groupTests } from "@/lib/group-tests";
import type { Flag, TestResult } from "@/lib/schema";
import { cn } from "@/lib/utils";

const DASH = "—";

const ROW_TINT: Partial<Record<Flag, string>> = {
  low: "bg-amber-50/70 hover:bg-amber-50",
  high: "bg-red-50/70 hover:bg-red-50",
  critical: "bg-red-50 hover:bg-red-100/70",
};

export function TestResultsTable({ tests }: { tests: TestResult[] }) {
  const groups = groupTests(tests);
  const showGroupHeadings = groups.length > 1 || groups[0]?.category !== "Other";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/2">Test</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="hidden sm:table-cell">Unit</TableHead>
            <TableHead className="hidden md:table-cell">Normal range</TableHead>
            <TableHead className="text-right">Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => [
            showGroupHeadings && (
              <TableRow key={`group-${group.category}`} className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={5} className="py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.category}
                </TableCell>
              </TableRow>
            ),
            ...group.tests.map((test, i) => (
              <TableRow
                key={`${group.category}-${test.name}-${i}`}
                data-testid="test-row"
                className={cn(ROW_TINT[test.flag])}
              >
                <TableCell className="align-top whitespace-normal">
                  <p className="font-medium">{test.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{test.explanation}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                    Normal range: {test.referenceRange?.text || DASH}
                  </p>
                </TableCell>
                <TableCell className="align-top font-mono tabular-nums">
                  {test.value}
                  {test.unit && <span className="ml-1 text-xs text-muted-foreground sm:hidden">{test.unit}</span>}
                </TableCell>
                <TableCell className="hidden align-top text-muted-foreground sm:table-cell">{test.unit || DASH}</TableCell>
                <TableCell className="hidden align-top text-muted-foreground md:table-cell">
                  {test.referenceRange?.text || DASH}
                </TableCell>
                <TableCell className="text-right align-top">
                  <FlagBadge flag={test.flag} />
                </TableCell>
              </TableRow>
            )),
          ])}
        </TableBody>
      </Table>
    </div>
  );
}
