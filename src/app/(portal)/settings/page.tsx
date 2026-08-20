"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getDealerUsersPage } from "@/features/dealer-users/api";
import { DealerUsersSkeleton } from "@/features/dealer-users/dealer-users-skeleton";
import { DealerUsersView } from "@/features/dealer-users/dealer-users-view";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    return { q, page, pageSize };
  }, [searchParams]);

  const resourceKey = [query.q, query.page, query.pageSize].join("|");
  const loader = useCallback(async () => {
    return getDealerUsersPage({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q || undefined,
    });
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <DealerUsersSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load company portal users."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <DealerUsersSkeleton />;
  }

  return (
    <DealerUsersView
      list={data.list}
      activeAdminCount={data.activeAdminCount}
      query={query}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<DealerUsersSkeleton />}>
      <SettingsPageInner />
    </Suspense>
  );
}
