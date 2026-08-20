"use client";

import { Badge, Skeleton } from "@/components/ui";
import { AnnouncementRowActions } from "@/features/announcements/components/announcements-table";
import type { Announcement } from "@/features/announcements/types";
import {
  channelLabel,
  displayPublishedAt,
  formatAnnouncementDate,
  postTypeLabel,
} from "@/features/announcements/types";

export function AnnouncementsCards({
  rows,
  loading,
  onView,
  emptyTitle,
  emptyDescription,
}: {
  rows: Announcement[];
  loading: boolean;
  onView?: (announcement: Announcement) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <div className="md:hidden">
      {loading ? (
        <div className="space-y-3 px-5 py-4" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          <p className="font-medium text-[var(--color-heading)]">
            {emptyTitle ?? "No announcements yet"}
          </p>
          <p className="mt-1">
            {emptyDescription ??
              "Circulars published for your company will appear here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => {
            const published = displayPublishedAt(row);
            return (
              <li key={row.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => onView?.(row)}
                  >
                    <p className="truncate font-semibold text-[var(--color-heading)]">
                      {row.title || "—"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                      {row.messageBody || "—"}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-start gap-1">
                    <Badge variant="info">{postTypeLabel(row.postType)}</Badge>
                    <AnnouncementRowActions
                      announcement={row}
                      onView={onView}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {published ? formatAnnouncementDate(published) : "—"}
                  {row.deliveryChannels.length > 0
                    ? ` · ${row.deliveryChannels.map(channelLabel).join(", ")}`
                    : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
