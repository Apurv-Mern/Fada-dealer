"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type {
  ChartSlice,
  PerformanceTile,
} from "@/features/branches/types";

const DonutChart = dynamic(
  () => import("@/components/ui/donut-chart").then((m) => m.DonutChart),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto h-48 w-48 rounded-full" />,
  },
);

const BarChart = dynamic(
  () => import("@/components/ui/bar-chart").then((m) => m.BarChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  },
);

export function BranchesCharts({
  totalEmployees,
  employeesByBranch,
  branchScores,
  branchPerformance,
}: {
  totalEmployees: number;
  employeesByBranch: ChartSlice[];
  branchScores: ChartSlice[];
  branchPerformance: PerformanceTile[];
}) {
  return (
    <>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees by Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              centerValue={totalEmployees}
              centerLabel="Employees"
              slices={employeesByBranch}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outlet Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {branchPerformance.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] p-4"
                >
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-[var(--color-heading)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outlet FADA Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart items={branchScores} max={1000} />
        </CardContent>
      </Card>
    </>
  );
}
