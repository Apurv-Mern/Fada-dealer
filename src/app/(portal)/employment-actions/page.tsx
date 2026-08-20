"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getEmploymentActionsPage } from "@/features/employment-actions/api";
import { EmploymentActionsSkeleton } from "@/features/employment-actions/employment-actions-skeleton";
import { EmploymentActionsView } from "@/features/employment-actions/employment-actions-view";
import {
  parseActionStatus,
  parseActionType,
  startOfMonthIso,
  todayIso,
} from "@/features/employment-actions/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function EmploymentActionsPageInner() {
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    const actionType = parseActionType(searchParams.get("actionType"));
    const status = parseActionStatus(searchParams.get("status"));
    const branchId = searchParams.get("branchId") ?? "";
    const from = searchParams.get("from") ?? startOfMonthIso();
    const to = searchParams.get("to") ?? todayIso();
    return { q, page, pageSize, actionType, status, branchId, from, to };
  }, [searchParams]);

  const resourceKey = [
    query.q,
    query.page,
    query.pageSize,
    query.actionType,
    query.status,
    query.branchId,
    query.from,
    query.to,
  ].join("|");

  const loader = useCallback(async () => {
    return getEmploymentActionsPage({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q || undefined,
      actionType: query.actionType || undefined,
      status: query.status || undefined,
      branchId: query.branchId || undefined,
      from: query.from || undefined,
      to: query.to || undefined,
    });
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <EmploymentActionsSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load employment actions."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <EmploymentActionsSkeleton />;
  }

  return (
    <EmploymentActionsView
      list={data.list}
      filteredItems={data.filteredItems}
      stats={data.stats}
      filterOptions={data.filterOptions}
      query={query}
      isRefreshing={isRefreshing}
    />
  );
}

export default function EmploymentActionsPage() {
  return (
    <Suspense fallback={<EmploymentActionsSkeleton />}>
      <EmploymentActionsPageInner />
    </Suspense>
  );
}
