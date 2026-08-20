"use client";

import { useCallback, useSyncExternalStore } from "react";

import { SectionError } from "@/components/layout/section-error";
import { getDashboardSummary } from "@/features/dashboard/api";
import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import {
  getProfile,
  subscribeAuthStore,
} from "@/features/auth/token-store";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

export default function DashboardPage() {
  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );
  const userName = profile?.name?.trim() || "Company";

  const loader = useCallback(() => getDashboardSummary(), []);
  const { data, error, loading, retry } = useAsyncResource({
    key: "dashboard-summary",
    loader,
  });

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <SectionError
        description={error ?? "Couldn't load dashboard."}
        onRetry={retry}
      />
    );
  }

  return <DashboardView summary={data} userName={userName} />;
}
