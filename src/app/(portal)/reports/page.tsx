"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getReport, getReportFilters } from "@/features/reports/api";
import { reportUrlQueryToApiParams } from "@/features/reports/map-report";
import {
  buildReportsSearchParams,
  parseReportsQuery,
  reportsResourceKey,
} from "@/features/reports/search-params";
import { ReportsSkeleton } from "@/features/reports/reports-skeleton";
import { ReportsView } from "@/features/reports/reports-view";
import { DEALER_REPORT_KEYS } from "@/features/reports/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function ReportsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(
    () => parseReportsQuery(searchParams),
    [searchParams],
  );

  const resourceKey = reportsResourceKey(query.reportKey, query);

  const loader = useCallback(async () => {
    const filters = await getReportFilters(
      query.reportKey ? query.reportKey : undefined,
    );

    const effectiveKey =
      query.reportKey ||
      filters.reports[0]?.key ||
      DEALER_REPORT_KEYS[0];

    const report = await getReport(
      effectiveKey,
      reportUrlQueryToApiParams(query),
    );

    return { filters, report, effectiveKey };
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  useEffect(() => {
    if (!data || query.reportKey) return;

    const defaultKey =
      data.filters.reports[0]?.key ?? data.effectiveKey ?? DEALER_REPORT_KEYS[0];
    const params = buildReportsSearchParams(defaultKey, query);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [data, query, pathname, router]);

  if (loading && !data) {
    return <ReportsSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load reports."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <ReportsSkeleton />;
  }

  const reportKey =
    query.reportKey ||
    data.filters.reports[0]?.key ||
    data.effectiveKey ||
    DEALER_REPORT_KEYS[0];

  if (!query.reportKey) {
    return <ReportsSkeleton />;
  }

  return (
    <ReportsView
      filters={data.filters}
      report={data.report}
      reportKey={reportKey}
      query={query}
      isRefreshing={isRefreshing}
    />
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsPageInner />
    </Suspense>
  );
}
