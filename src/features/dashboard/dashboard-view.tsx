"use client";

import type { DashboardSummary } from "@/features/dashboard/types";
import { DashboardWelcomeHeader } from "@/features/dashboard/components/dashboard-welcome";
import { DashboardStatsRow } from "@/features/dashboard/components/dashboard-stats";
import { DashboardMiddleRow } from "@/features/dashboard/components/dashboard-middle";
import { DashboardRecentRequests } from "@/features/dashboard/components/dashboard-recent-requests";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";

export function DashboardView({
  summary,
  userName,
}: {
  summary: DashboardSummary;
  userName: string;
}) {
  return (
    <div>
      <DashboardWelcomeHeader
        userName={userName}
        dateRangeLabel={summary.dateRangeLabel}
      />
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
    </div>
  );
}
