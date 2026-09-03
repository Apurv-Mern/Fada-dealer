"use client";

import { Suspense, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getDashboardSummary } from "@/features/dashboard/api";
import { DashboardSkeleton } from "@/features/dashboard/dashboard-skeleton";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import {
  buildDashboardSearchParams,
  dashboardQueryToApiParams,
  dashboardResourceKey,
  parseDashboardQuery,
} from "@/features/dashboard/search-params";
import {
  getProfile,
  subscribeAuthStore,
} from "@/features/auth/token-store";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function DashboardPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );
  const userName = profile?.name?.trim() || "Company";

  const query = useMemo(
    () => parseDashboardQuery(searchParams),
    [searchParams],
  );
  const resourceKey = dashboardResourceKey(query);

  const loader = useCallback(
    () => getDashboardSummary(dashboardQueryToApiParams(query)),
    [query],
  );

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  const hasUrlDates = Boolean(query.startDate && query.endDate);

  useEffect(() => {
    if (!data || hasUrlDates) return;
    if (!data.startDate || !data.endDate) return;

    const params = buildDashboardSearchParams({
      startDate: data.startDate,
      endDate: data.endDate,
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [data, hasUrlDates, pathname, router]);

  const handleDateRangeChange = useCallback(
    ({ from, to }: { from: string; to: string }) => {
      const params = buildDashboardSearchParams({
        startDate: from,
        endDate: to,
      });
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load dashboard."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <DashboardView
      summary={data}
      userName={userName}
      startDate={query.startDate || data.startDate}
      endDate={query.endDate || data.endDate}
      onDateRangeChange={handleDateRangeChange}
      isRefreshing={isRefreshing}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}
