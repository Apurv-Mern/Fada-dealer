"use client";

import { useCallback } from "react";

import { SectionError } from "@/components/layout/section-error";
import { getBranchDashboard } from "@/features/branches/api";
import { BranchesSkeleton } from "@/features/branches/branches-skeleton";
import {
  BranchesHeader,
  BranchesView,
} from "@/features/branches/branches-view";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

export default function BranchesPage() {
  const dashboardLoader = useCallback(() => getBranchDashboard(), []);

  const {
    data: dashboard,
    error: dashboardError,
    loading: dashboardLoading,
    isRefreshing: dashboardRefreshing,
    retry: retryDashboard,
  } = useAsyncResource({
    key: "branch-dashboard|main",
    loader: dashboardLoader,
  });

  const showDashboardSkeleton =
    (dashboardLoading && !dashboard) || dashboardRefreshing;

  if (showDashboardSkeleton) {
    return (
      <div>
        <BranchesHeader />
        <BranchesSkeleton hideHeader />
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div>
        <BranchesHeader />
        <SectionError
          description={dashboardError ?? "Couldn't load outlets."}
          onRetry={retryDashboard}
        />
      </div>
    );
  }

  return <BranchesView dashboard={dashboard} onRefresh={retryDashboard} />;
}
