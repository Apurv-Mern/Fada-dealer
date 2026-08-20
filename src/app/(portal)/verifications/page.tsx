"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getEmploymentRequestsPage } from "@/features/employment-requests/api";
import { EmploymentRequestsSkeleton } from "@/features/employment-requests/employment-requests-skeleton";
import { EmploymentRequestsView } from "@/features/employment-requests/employment-requests-view";
import {
  parseRequestStatus,
  parseRequestType,
} from "@/features/employment-requests/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function EmploymentRequestsPageInner() {
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    const type = parseRequestType(searchParams.get("type"));
    const status = parseRequestStatus(searchParams.get("status"));
    const branchId = searchParams.get("branchId") ?? "";
    return { q, page, pageSize, type, status, branchId };
  }, [searchParams]);

  const resourceKey = [
    query.q,
    query.page,
    query.pageSize,
    query.type,
    query.status,
    query.branchId,
  ].join("|");

  const loader = useCallback(async () => {
    return getEmploymentRequestsPage({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q || undefined,
      type: query.type || undefined,
      status: query.status || undefined,
      branchId: query.branchId || undefined,
    });
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <EmploymentRequestsSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load employment requests."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <EmploymentRequestsSkeleton />;
  }

  return (
    <EmploymentRequestsView
      list={data.list}
      filteredItems={data.filteredItems}
      stats={data.stats}
      typeCounts={data.typeCounts}
      filterOptions={data.filterOptions}
      query={query}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

export default function EmploymentRequestsPage() {
  return (
    <Suspense fallback={<EmploymentRequestsSkeleton />}>
      <EmploymentRequestsPageInner />
    </Suspense>
  );
}
