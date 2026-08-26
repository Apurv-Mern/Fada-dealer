"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { extractBreakdownCharts } from "@/features/reports/map-report";

const BarChart = dynamic(
  () => import("@/components/ui/bar-chart").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

export type ReportsBreakdownsProps = {
  breakdowns: Record<string, unknown>;
};

export function ReportsBreakdowns({ breakdowns }: ReportsBreakdownsProps) {
  const charts = extractBreakdownCharts(breakdowns);
  if (charts.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-base font-semibold text-[var(--color-heading)]">
        Insights
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map((chart) => (
          <Card key={chart.title} className="min-w-0">
            <CardHeader>
              <CardTitle className="text-base">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart items={chart.items} />
              {chart.items.length <= 5 ? (
                <ul className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3">
                  {chart.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[var(--color-text-muted)]">
                        {item.label}
                      </span>
                      <span className="font-medium text-[var(--color-heading)]">
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function hasBreakdownData(breakdowns: Record<string, unknown>): boolean {
  return extractBreakdownCharts(breakdowns).length > 0;
}
