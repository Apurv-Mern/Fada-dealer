"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  Tooltip,
  type DataTableColumn,
} from "@/components/ui";
import type { Announcement } from "@/features/announcements/types";
import {
  channelLabel,
  displayPublishedAt,
  formatAnnouncementDate,
  postTypeLabel,
} from "@/features/announcements/types";

export function AnnouncementRowActions({
  announcement,
  onView,
}: {
  announcement: Announcement;
  onView?: (announcement: Announcement) => void;
}) {
  return (
    <div className="flex shrink-0 justify-end">
      <Tooltip content="View announcement">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${announcement.title}`}
          onClick={() => onView?.(announcement)}
        >
          <Eye />
        </Button>
      </Tooltip>
    </div>
  );
}

export function AnnouncementsTable({
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
  const columns = useMemo<DataTableColumn<Announcement>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        className: "min-w-[12rem] font-semibold text-[var(--color-heading)]",
        cell: (row) => (
          <button
            type="button"
            className="max-w-[20rem] truncate text-left hover:underline"
            onClick={() => onView?.(row)}
          >
            {row.title || "—"}
          </button>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: (row) => (
          <Badge variant="info">{postTypeLabel(row.postType)}</Badge>
        ),
      },
      {
        id: "published",
        header: "Published",
        cell: (row) => {
          const iso = displayPublishedAt(row);
          return iso ? formatAnnouncementDate(iso) : "—";
        },
      },
      {
        id: "channels",
        header: "Channels",
        cell: (row) =>
          row.deliveryChannels.length === 0 ? (
            "—"
          ) : (
            <div className="flex flex-wrap gap-1">
              {row.deliveryChannels.map((ch) => (
                <Badge key={ch} variant="default">
                  {channelLabel(ch)}
                </Badge>
              ))}
            </div>
          ),
      },
      {
        id: "actions",
        header: "",
        className: "w-12 text-right",
        cell: (row) => (
          <AnnouncementRowActions announcement={row} onView={onView} />
        ),
      },
    ],
    [onView],
  );

  return (
    <div className="hidden md:block">
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        empty={{
          title: emptyTitle ?? "No announcements yet",
          description:
            emptyDescription ??
            "Circulars published for your company will appear here.",
        }}
      />
    </div>
  );
}
