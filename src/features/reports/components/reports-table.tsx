"use client";

import { FileSpreadsheet } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import {
  deriveRowColumns,
  formatCellValue,
  formatSummaryLabel,
  isStatusColumnKey,
  reportStatusBadgeVariant,
} from "@/features/reports/map-report";

export type ReportsTableProps = {
  rows: Record<string, unknown>[];
  total?: number;
  hasInsights?: boolean;
  isRefreshing?: boolean;
};

function ReportCell({
  column,
  value,
}: {
  column: string;
  value: unknown;
}) {
  if (
    isStatusColumnKey(column) &&
    typeof value === "string" &&
    value.trim()
  ) {
    return (
      <Badge variant={reportStatusBadgeVariant(value)}>
        {formatSummaryLabel(value)}
      </Badge>
    );
  }

  return <>{formatCellValue(value, column)}</>;
}

export function ReportsTable({
  rows,
  total,
  hasInsights = false,
  isRefreshing,
}: ReportsTableProps) {
  const columns = deriveRowColumns(rows);
  const rowCount = total ?? rows.length;

  if (rows.length === 0 && !isRefreshing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={FileSpreadsheet}
            title="No rows for this report"
            description={
              hasInsights
                ? "This report is summary-only — see metrics and insights above."
                : "Try adjusting the date range or filters, then generate again."
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">Details</CardTitle>
        {!isRefreshing && rowCount > 0 ? (
          <span className="text-sm text-[var(--color-text-muted)]">
            {rowCount} {rowCount === 1 ? "row" : "rows"}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="px-0 pb-0 md:px-6 md:pb-6">
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  {columns.map((column) => (
                    <TH key={column}>{formatSummaryLabel(column)}</TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {isRefreshing
                  ? Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TR key={`sk-${rowIndex}`}>
                        {columns.map((column) => (
                          <TD key={column}>
                            <Skeleton className="h-4 w-full max-w-[10rem]" />
                          </TD>
                        ))}
                      </TR>
                    ))
                  : rows.map((row, rowIndex) => (
                      <TR key={rowIndex}>
                        {columns.map((column) => (
                          <TD key={column}>
                            <ReportCell column={column} value={row[column]} />
                          </TD>
                        ))}
                      </TR>
                    ))}
              </TBody>
            </Table>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4 md:hidden">
          {isRefreshing
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={`card-sk-${i}`}>
                  <CardContent className="space-y-2 p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </CardContent>
                </Card>
              ))
            : rows.map((row, rowIndex) => (
                <Card key={rowIndex}>
                  <CardContent className="space-y-2 p-4">
                    {columns.map((column) => (
                      <div
                        key={column}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="text-[var(--color-text-muted)]">
                          {formatSummaryLabel(column)}
                        </span>
                        <span className="text-right font-medium text-[var(--color-heading)]">
                          <ReportCell column={column} value={row[column]} />
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
