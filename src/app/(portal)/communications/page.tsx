"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SectionError } from "@/components/layout/section-error";
import { getAnnouncementsPage } from "@/features/announcements/api";
import { AnnouncementsSkeleton } from "@/features/announcements/announcements-skeleton";
import { AnnouncementsView } from "@/features/announcements/announcements-view";
import { isNotificationCategory } from "@/features/notifications/types";
import type { NotificationCategory } from "@/features/notifications/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function CommunicationsPageInner() {
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    const categoryRaw = searchParams.get("category");
    const category: NotificationCategory | "" = isNotificationCategory(
      categoryRaw,
    )
      ? categoryRaw
      : "";
    return { q, page, pageSize, category };
  }, [searchParams]);

  const resourceKey = [
    query.q,
    query.page,
    query.pageSize,
    query.category,
  ].join("|");

  const loader = useCallback(async () => {
    return getAnnouncementsPage({
      page: query.page,
      pageSize: query.pageSize,
      q: query.q || undefined,
      category: query.category || undefined,
    });
  }, [query]);

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) {
    return <AnnouncementsSkeleton />;
  }

  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load announcements."}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <AnnouncementsView
      list={data.list}
      filteredItems={data.filteredItems}
      totalUnfiltered={data.totalUnfiltered}
      query={query}
      isRefreshing={isRefreshing}
    />
  );
}

export default function CommunicationsPage() {
  return (
    <Suspense fallback={<AnnouncementsSkeleton />}>
      <CommunicationsPageInner />
    </Suspense>
  );
}
