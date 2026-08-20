"use client";

import { Badge, Dialog } from "@/components/ui";
import type { Announcement } from "@/features/announcements/types";
import {
  audienceLabel,
  channelLabel,
  displayPublishedAt,
  formatAnnouncementDate,
  postTypeLabel,
} from "@/features/announcements/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-[var(--color-heading)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export function AnnouncementViewDialog({
  announcement,
  open,
  onOpenChange,
}: {
  announcement: Announcement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const published = announcement ? displayPublishedAt(announcement) : "";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={announcement?.title ?? "Announcement"}
      description={
        announcement ? postTypeLabel(announcement.postType) : undefined
      }
      className="max-w-lg"
    >
      {!announcement ? null : (
        <div className="space-y-4">
          <dl className="space-y-3">
            <DetailRow
              label="Published"
              value={published ? formatAnnouncementDate(published) : "—"}
            />
            <DetailRow
              label="Audience"
              value={audienceLabel(announcement.targetAudience)}
            />
            <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--color-text-muted)]">Status</dt>
              <dd>
                <Badge
                  variant={
                    announcement.status === "published" ? "success" : "info"
                  }
                >
                  {announcement.status}
                </Badge>
              </dd>
            </div>
            <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-[var(--color-text-muted)]">Channels</dt>
              <dd className="flex flex-wrap gap-1">
                {announcement.deliveryChannels.length === 0 ? (
                  <span className="font-medium text-[var(--color-heading)]">
                    —
                  </span>
                ) : (
                  announcement.deliveryChannels.map((ch) => (
                    <Badge key={ch} variant="default">
                      {channelLabel(ch)}
                    </Badge>
                  ))
                )}
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-sm text-[var(--color-text-muted)]">
              Message
            </p>
            <div className="max-h-64 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm whitespace-pre-wrap text-[var(--color-heading)]">
              {announcement.messageBody || "—"}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
