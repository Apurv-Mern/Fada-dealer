"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getReport, getReportFilters } from "@/features/reports/api";
import { ReportsSkeleton } from "@/features/reports/reports-skeleton";
import { ReportsView } from "@/features/reports/reports-view";
import { isDealerReportKey } from "@/features/reports/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function ReportsPageInner() {
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const keyRaw = searchParams.get("key") ?? "";
    const reportKey = isDealerReportKey(keyRaw) ? keyRaw : ("" as const);
    const fromDate = searchParams.get("fromDate") ?? "";
    const toDate = searchParams.get("toDate") ?? "";
    const departmentId = searchParams.get("departmentId") ?? "";
    const designationId = searchParams.get("designationId") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    return {
      reportKey,
      fromDate,
      toDate,
      departmentId,
      designationId,
      page,
      pageSize,
    };
  }, [searchParams]);

  const resourceKey = [
    query.reportKey,
    query.fromDate,
    query.toDate,
    query.departmentId,
    query.designationId,
    query.page,
    query.pageSize,
  ].join("|");

  const loader = useCallback(async () => {
    const filters = await getReportFilters(
      query.reportKey ? query.reportKey : undefined,
    );
    const report = query.reportKey
      ? await getReport(query.reportKey, {
          fromDate: query.fromDate || undefined,
          toDate: query.toDate || undefined,
          departmentId: query.departmentId || undefined,
          designationId: query.designationId || undefined,
          page: query.page,
          pageSize: query.pageSize,
        })
      : null;
    return { filters, report };
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <ReportsSkeleton showViewer={Boolean(query.reportKey)} />;
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
    return <ReportsSkeleton showViewer={Boolean(query.reportKey)} />;
  }

  return (
    <ReportsView
      filters={data.filters}
      report={data.report}
      reportKey={query.reportKey}
      query={{
        fromDate: query.fromDate,
        toDate: query.toDate,
        departmentId: query.departmentId,
        designationId: query.designationId,
        page: query.page,
        pageSize: query.pageSize,
      }}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <ReportsSkeleton showViewer={false} />
      }
    >
      <ReportsPageInner />
    </Suspense>
  );
}
