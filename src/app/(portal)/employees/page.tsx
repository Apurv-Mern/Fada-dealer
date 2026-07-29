"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import {
  getEmployeeFilterOptions,
  getEmployees,
  getEmployeeStats,
} from "@/features/employees/api";
import { EmployeesSkeleton } from "@/features/employees/employees-skeleton";
import { EmployeesView } from "@/features/employees/employees-view";
import { parseStatus } from "@/features/employees/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function EmployeesPageInner() {
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    const branchId = searchParams.get("branchId") ?? "";
    const designationId = searchParams.get("designationId") ?? "";
    const status = parseStatus(searchParams.get("status"));
    return { q, page, pageSize, branchId, designationId, status };
  }, [searchParams]);

  const resourceKey = [
    query.q,
    query.page,
    query.pageSize,
    query.branchId,
    query.designationId,
    query.status,
  ].join("|");

  const loader = useCallback(async () => {
    const [list, stats, filterOptions] = await Promise.all([
      getEmployees({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q || undefined,
        branchId: query.branchId || undefined,
        designationId: query.designationId || undefined,
        status: query.status || undefined,
      }),
      getEmployeeStats(),
      getEmployeeFilterOptions(),
    ]);
    return { list, stats, filterOptions };
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <EmployeesSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load employees."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <EmployeesSkeleton />;
  }

  return (
    <EmployeesView
      list={data.list}
      stats={data.stats}
      filterOptions={data.filterOptions}
      query={query}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<EmployeesSkeleton />}>
      <EmployeesPageInner />
    </Suspense>
  );
}
