"use client";

import { Megaphone } from "lucide-react";

import { EmptyState, Skeleton } from "@/components/ui";
import type { Announcement } from "@/features/announcements/types";
import {
  displayPublishedAt,
  formatAnnouncementShortDate,
} from "@/features/announcements/types";
import { truncateDescription } from "@/features/notifications/utils";

export function AnnouncementTiles({
  rows,
  loading,
  onView,
  emptyTitle,
  emptyDescription,
  updatesLabel,
}: {
  rows: Announcement[];
  loading?: boolean;
  onView?: (row: Announcement) => void;
  emptyTitle: string;
  emptyDescription: string;
  updatesLabel?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2 px-5 py-4" aria-busy>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title={emptyTitle}
        description={emptyDescription}
        className="py-12"
      />
    );
  }

  return (
    <div className="px-5 py-4">
      {updatesLabel ? (
        <p className="mb-3 text-right text-xs font-medium text-[var(--color-text-muted)]">
          {updatesLabel}
        </p>
      ) : null}
      <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
        {rows.map((row) => {
          const dateIso = displayPublishedAt(row);
          const preview = truncateDescription(row.messageBody || "—", 100);
          return (
            <li key={row.id}>
              <button
                type="button"
                aria-label={row.title}
                onClick={() => onView?.(row)}
                className="flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[var(--color-muted)]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-ring)]"
              >
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"
                  title="Announcement"
                  aria-hidden
                >
                  <Megaphone className="size-4" />
                </span>
                <span
                  className="min-w-0 max-w-[42%] shrink-0 truncate text-sm font-semibold text-[var(--color-heading)]"
                  title={row.title}
                >
                  {row.title}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-xs text-[var(--color-text-muted)]"
                  title={row.messageBody || undefined}
                >
                  {preview}
                </span>
                <time
                  className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]"
                  dateTime={dateIso || undefined}
                >
                  {formatAnnouncementShortDate(dateIso)}
                </time>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
