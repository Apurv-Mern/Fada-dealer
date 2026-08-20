"use client";

import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  Megaphone,
  PartyPopper,
  RefreshCw,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

import { Skeleton } from "@/components/ui";
import type {
  NotificationCategory,
  NotificationItem,
} from "@/features/notifications/types";
import { formatRelativeTime } from "@/features/notifications/utils";
import { cn } from "@/lib/utils/cn";

const categoryStyle: Record<
  NotificationCategory,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  updates: {
    icon: RefreshCw,
    className: "bg-emerald-50 text-emerald-700",
  },
  reminders: {
    icon: CalendarCheck,
    className: "bg-orange-50 text-orange-600",
  },
  celebration: {
    icon: PartyPopper,
    className: "bg-violet-50 text-violet-600",
  },
  announcement: {
    icon: Megaphone,
    className: "bg-sky-50 text-sky-600",
  },
};

function iconForItem(item: NotificationItem) {
  const title = item.title.toLowerCase();
  if (title.includes("skill")) {
    return { icon: BarChart3, className: "bg-sky-50 text-sky-600" };
  }
  if (title.includes("invitation") || title.includes("invite")) {
    return { icon: Briefcase, className: "bg-orange-50 text-orange-600" };
  }
  if (title.includes("certificate")) {
    return { icon: CalendarCheck, className: "bg-amber-50 text-amber-600" };
  }
  if (title.includes("profile")) {
    return { icon: UserRoundPlus, className: "bg-violet-50 text-violet-600" };
  }
  if (title.includes("verification")) {
    return { icon: ShieldCheck, className: "bg-emerald-50 text-emerald-700" };
  }
  return categoryStyle[item.category];
}

export function NotificationListItem({ item }: { item: NotificationItem }) {
  const style = iconForItem(item);
  const Icon = style.icon;
  const unread = !item.read;

  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2">
      <span
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
          style.className,
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-heading)]">
            {item.title}
          </p>
          <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-muted)]">
          {item.description}
        </p>
      </div>
      {unread ? (
        <span
          className="size-2 shrink-0 self-center rounded-full bg-[var(--color-primary)]"
          aria-label="Unread"
        />
      ) : (
        <span className="size-2 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function NotificationDropdownList({
  items,
  loading,
}: {
  items: NotificationItem[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-1 px-2 py-1.5" aria-busy>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-5 text-center text-sm text-[var(--color-text-muted)]">
        No notifications yet
      </p>
    );
  }

  return (
    <ul className="max-h-[min(22rem,55vh)] divide-y divide-[var(--color-border)] overflow-y-auto">
      {items.map((item) => (
        <li key={item.id}>
          <NotificationListItem item={item} />
        </li>
      ))}
    </ul>
  );
}
