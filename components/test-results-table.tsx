import { FlagBadge } from "@/components/flag-badge";
import { RangeBar } from "@/components/range-bar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { groupTests } from "@/lib/group-tests";
import type { TestResult } from "@/lib/schema";

const DASH = "—";

export function TestResultsTable({ tests }: { tests: TestResult[] }) {
  const groups = groupTests(tests);
  const showGroupHeadings = groups.length > 1 || groups[0]?.category !== "Other";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table className="md:table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-10 px-4 text-xs font-normal text-muted-foreground">Test</TableHead>
            <TableHead className="hidden h-10 px-4 text-xs font-normal text-muted-foreground sm:table-cell md:w-36">
              Result
            </TableHead>
            <TableHead className="hidden h-10 w-48 px-4 text-xs font-normal text-muted-foreground md:table-cell">
              Normal range
            </TableHead>
            <TableHead className="h-10 px-4 text-right text-xs font-normal text-muted-foreground md:w-24">Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => [
            showGroupHeadings && (
              <TableRow key={`group-${group.category}`} className="bg-muted/60 hover:bg-muted/60">
                <TableCell colSpan={4} className="h-8 px-4 py-0 text-xs font-medium text-muted-foreground">
                  {group.category}
                </TableCell>
              </TableRow>
            ),
            ...group.tests.map((test, i) => (
              <TableRow key={`${group.category}-${test.name}-${i}`} data-testid="test-row">
                <TableCell className="px-4 py-3 align-top whitespace-normal">
                  <p className="font-medium">{test.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{test.explanation}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 md:hidden">
                    <span className="text-sm tabular-nums sm:hidden">
                      <span className="font-medium">{test.value}</span>
                      {test.unit && <span className="ml-1 text-xs text-muted-foreground">{test.unit}</span>}
                    </span>
                    <RangeBar test={test} className="w-24 shrink-0" />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Normal {test.referenceRange?.text || DASH}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden px-4 py-3 align-top whitespace-nowrap tabular-nums sm:table-cell md:whitespace-normal">
                  <span className="font-medium">{test.value}</span>
                  {test.unit && <span className="ml-1 text-xs text-muted-foreground">{test.unit}</span>}
                </TableCell>
                <TableCell className="hidden px-4 py-3 align-top md:table-cell">
                  <RangeBar test={test} className="mt-1" />
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">{test.referenceRange?.text || DASH}</p>
                </TableCell>
                <TableCell className="px-4 py-3 text-right align-top">
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
