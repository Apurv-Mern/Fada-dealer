"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  SearchInput,
  Pagination,
} from "@/components/ui";
import { AnnouncementViewDialog } from "@/features/announcements/components/announcement-view-dialog";
import { AnnouncementsGlance } from "@/features/announcements/components/announcements-glance";
import { AnnouncementTiles } from "@/features/announcements/components/announcement-tiles";
import type { Announcement } from "@/features/announcements/types";
import { useNotifications } from "@/features/notifications/notifications-context";
import type { NotificationCategory } from "@/features/notifications/types";
import type { ListResult } from "@/types/api";

export type AnnouncementsViewProps = {
  list: ListResult<Announcement>;
  filteredItems: Announcement[];
  query: {
    q: string;
    page: number;
    pageSize: number;
    category: NotificationCategory | "";
  };
  isRefreshing: boolean;
  /** Total before client search/category filter (for empty-state copy). */
  totalUnfiltered: number;
};

export function AnnouncementsView({
  list,
  filteredItems,
  query,
  isRefreshing,
  totalUnfiltered,
}: AnnouncementsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { glanceCounts } = useNotifications();

  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [viewing, setViewing] = useState<Announcement | null>(null);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  const syncUrl = useCallback(
    (next: {
      page?: number;
      pageSize?: number;
      q?: string;
      category?: NotificationCategory | "";
    }) => {
      const params = new URLSearchParams();
      const nextPage = next.page ?? query.page;
      const nextPageSize = next.pageSize ?? query.pageSize;
      const nextQ = next.q ?? query.q;
      const nextCategory =
        next.category !== undefined ? next.category : query.category;

      if (nextQ) params.set("q", nextQ);
      if (nextCategory) params.set("category", nextCategory);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPageSize !== 10) params.set("pageSize", String(nextPageSize));

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, query],
  );

  useEffect(() => {
    if (searchDraft === query.q) return;
    const handle = window.setTimeout(() => {
      syncUrl({ page: 1, q: searchDraft });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query.q, syncUrl]);

  const hasSearch = Boolean(query.q.trim());
  const hasCategory = Boolean(query.category);
  const emptyTitle = hasSearch
    ? "No announcements match your search"
    : hasCategory && query.category !== "announcement"
      ? "No items in this category yet"
      : "No announcements yet";
  const emptyDescription = hasSearch
    ? "Try a different title or keyword."
    : hasCategory && query.category !== "announcement"
      ? "This category will show updates when available."
      : "Circulars published for your company will appear here.";

  const announcementCount =
    query.category && query.category !== "announcement"
      ? 0
      : filteredItems.length;

  const glanceDisplayCounts = {
    ...glanceCounts,
    announcement:
      glanceCounts.announcement > 0
        ? glanceCounts.announcement
        : totalUnfiltered,
  };

  return (
    <div>
      <PageHeader
        title="Communications"
        description="Announcements and circulars published for your company."
      />

      <AnnouncementsGlance
        counts={glanceDisplayCounts}
        activeCategory={query.category}
        onSelect={(category) => syncUrl({ page: 1, category })}
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-4">
          <SearchInput
            placeholder="Search by title or message"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            containerClassName="w-full"
          />
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <AnnouncementTiles
            rows={list.items}
            loading={isRefreshing}
            onView={setViewing}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            updatesLabel={`${announcementCount} Update${announcementCount === 1 ? "" : "s"}`}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="announcements"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />
        </CardContent>
      </Card>

      <AnnouncementViewDialog
        announcement={viewing}
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
    </div>
  );
}
