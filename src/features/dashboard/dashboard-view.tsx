"use client";

import type { DashboardSummary } from "@/features/dashboard/types";
import { DashboardWelcomeHeader } from "@/features/dashboard/components/dashboard-welcome";
import { DashboardStatsRow } from "@/features/dashboard/components/dashboard-stats";
import { DashboardMiddleRow } from "@/features/dashboard/components/dashboard-middle";
import { DashboardRecentRequests } from "@/features/dashboard/components/dashboard-recent-requests";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardView({
  summary,
  userName,
  startDate,
  endDate,
  onDateRangeChange,
  isRefreshing = false,
}: {
  summary: DashboardSummary;
  userName: string;
  startDate: string;
  endDate: string;
  onDateRangeChange: (next: { from: string; to: string }) => void;
  isRefreshing?: boolean;
}) {
  return (
    <div>
      <DashboardWelcomeHeader
        userName={userName}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
      />
      {isRefreshing ? (
        <div className="mb-6 space-y-4" aria-busy="true" aria-live="polite">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-[var(--radius-lg)]" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-[var(--radius-lg)]" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-[var(--radius-lg)]" />
        </div>
      ) : (
        <>
          <DashboardStatsRow stats={summary.stats} />
          <DashboardMiddleRow
            employeesByBranch={summary.employeesByBranch}
            employeesByBranchTotal={summary.employeesByBranchTotal}
            pendingRequests={summary.pendingRequests}
            score={summary.score}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <DashboardRecentRequests rows={summary.recentRequests} />
            <DashboardQuickActions />
          </div>
        </>
      )}
    </div>
  );
}
