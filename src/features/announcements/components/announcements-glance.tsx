"use client";

import {
  CalendarDays,
  Megaphone,
  PartyPopper,
  RefreshCw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { NotificationCategory } from "@/features/notifications/types";
import { cn } from "@/lib/utils/cn";

const glanceItems: {
  category: NotificationCategory;
  label: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}[] = [
  {
    category: "updates",
    label: "Updates",
    subtext: "Today",
    icon: RefreshCw,
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
  {
    category: "reminders",
    label: "Reminders",
    subtext: "Pending",
    icon: CalendarDays,
    iconClassName: "bg-orange-50 text-orange-600",
  },
  {
    category: "celebration",
    label: "Celebration",
    subtext: "Today",
    icon: PartyPopper,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  {
    category: "announcement",
    label: "Announcement",
    subtext: "New",
    icon: Megaphone,
    iconClassName: "bg-sky-50 text-sky-600",
  },
];

export function AnnouncementsGlance({
  counts,
  activeCategory,
  onSelect,
}: {
  counts: Record<NotificationCategory, number>;
  activeCategory: NotificationCategory | "";
  onSelect: (category: NotificationCategory | "") => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Your updates at a glance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {glanceItems.map((item) => {
            const active = activeCategory === item.category;
            const Icon = item.icon;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() =>
                  onSelect(active ? "" : item.category)
                }
                className={cn(
                  "flex flex-col items-center rounded-[var(--radius-md)] border px-3 py-4 text-center transition-colors",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]"
                    : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40",
                )}
                aria-pressed={active}
              >
                <span
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-full",
                    item.iconClassName,
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 text-xl font-bold text-[var(--color-heading)]">
                  {counts[item.category] ?? 0}
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--color-heading)]">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {item.subtext}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
