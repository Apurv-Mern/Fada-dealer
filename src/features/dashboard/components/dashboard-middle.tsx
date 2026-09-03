"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  LogOut,
  UserPlus,
} from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DonutChart,
  RequestMetricRow,
  ScoreSpectrum,
  buttonVariants,
  type DonutSlice,
} from "@/components/ui";
import type {
  FadaScoreSummary,
  PendingRequestCounts,
} from "@/features/dashboard/types";
import { cn } from "@/lib/utils/cn";

export function DashboardMiddleRow({
  employeesByBranch,
  employeesByBranchTotal,
  pendingRequests,
  score,
}: {
  employeesByBranch: DonutSlice[];
  employeesByBranchTotal: number;
  pendingRequests: PendingRequestCounts;
  score: FadaScoreSummary;
}) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Employees by Outlet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <DonutChart
            centerValue={employeesByBranchTotal}
            centerLabel="Total"
            slices={
              employeesByBranch.length > 0
                ? employeesByBranch
                : [
                    {
                      label: "No data",
                      value: 0,
                      color: "var(--color-border)",
                    },
                  ]
            }
            className={
              employeesByBranch.length === 0
                ? "[&_ul]:hidden sm:justify-center"
                : undefined
            }
          />
        </CardContent>
      </Card>

      <PendingRequestsCard pending={pendingRequests} />
      <FadaScoreCard score={score} />
    </div>
  );
}

function PendingRequestsCard({ pending }: { pending: PendingRequestCounts }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Employment Requests (Pending)</CardTitle>
        <Badge variant="warning">{pending.total}</Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1">
        <RequestMetricRow
          title="Join Requests"
          count={pending.join}
          icon={UserPlus}
          tone="blue"
          href="/verifications"
        />
        <RequestMetricRow
          title="Exit Requests"
          count={pending.exit}
          icon={LogOut}
          tone="red"
          href="/verifications"
        />
        <RequestMetricRow
          title="Transfer Requests"
          count={pending.transfer}
          icon={ArrowRightLeft}
          tone="purple"
          href="/verifications"
        />
        <Link
          href="/verifications"
          className={cn(
            buttonVariants({ variant: "secondary", fullWidth: true }),
            "mt-auto border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
          )}
        >
          Review Requests
          <ArrowRight />
        </Link>
      </CardContent>
    </Card>
  );
}

function FadaScoreCard({ score }: { score: FadaScoreSummary }) {
  const badgeStyle = score.statusColor
    ? {
        backgroundColor: `${score.statusColor}20`,
        color: score.statusColor,
      }
    : undefined;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>FADA Score Summary</CardTitle>
        <Badge variant={score.statusColor ? "default" : "muted"} style={badgeStyle}>
          {score.status}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <ScoreSpectrum value={score.averagePct} />
        <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[var(--color-border)] pt-4">
          <Metric label="TOP 25%" value={`${score.top25Pct}%`} />
          <Metric label="AVG. SCORE" value={score.averageDisplay} />
          <Metric label="EMPLOYEES" value={score.employees} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[10px] font-semibold tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[var(--color-heading)]">
        {value}
      </p>
    </div>
  );
}
