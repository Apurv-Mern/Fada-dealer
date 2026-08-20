"use client";

import { Suspense, useCallback } from "react";

import { SectionError } from "@/components/layout/section-error";
import {
  getEmployee,
  getEmployeeFilterOptions,
} from "@/features/employees/api";
import {
  EmployeeDetailView,
  EmployeeNotFoundState,
} from "@/features/employees/employee-detail-view";
import { EmployeeDetailSkeleton } from "@/features/employees/employee-detail-skeleton";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";
import { ApiError } from "@/lib/api/errors";

type DetailLoadResult =
  | { notFound: true }
  | {
      notFound: false;
      employee: Awaited<ReturnType<typeof getEmployee>>;
      filterOptions: Awaited<ReturnType<typeof getEmployeeFilterOptions>>;
    };

function EmployeeDetailPageInner({ id }: { id: string }) {
  const loader = useCallback(async (): Promise<DetailLoadResult> => {
    try {
      const [employee, filterOptions] = await Promise.all([
        getEmployee(id),
        getEmployeeFilterOptions(),
      ]);
      return { notFound: false, employee, filterOptions };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return { notFound: true };
      }
      throw err;
    }
  }, [id]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: id,
    loader,
    enabled: Boolean(id),
  });

  if (!id) {
    return <EmployeeNotFoundState />;
  }

  if (loading && !data) {
    return <EmployeeDetailSkeleton />;
  }

  if (data?.notFound) {
    return <EmployeeNotFoundState />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load employee profile."}
        onRetry={retry}
      />
    );
  }

  if (!data || data.notFound) {
    return <EmployeeDetailSkeleton />;
  }

  return (
    <EmployeeDetailView
      employee={data.employee}
      filterOptions={data.filterOptions}
      onRefresh={retry}
    />
  );
}

export function EmployeeDetailPageClient({ id }: { id: string }) {
  return (
    <Suspense fallback={<EmployeeDetailSkeleton />}>
      <EmployeeDetailPageInner id={id} />
    </Suspense>
  );
}
