"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { routes } from "@/config/navigation";
import { NotificationDropdownList } from "@/features/notifications/components/notification-list-item";
import { useNotifications } from "@/features/notifications/notifications-context";
import { formatBadgeCount } from "@/features/notifications/utils";

export function NotificationsBellDropdown({
  isPortalLocked = false,
  onLockedNavAttempt,
}: {
  isPortalLocked?: boolean;
  onLockedNavAttempt?: () => void;
}) {
  const router = useRouter();
  const { topFive, unreadCount, loading } = useNotifications();
  const badge = formatBadgeCount(unreadCount);

  function handleViewAll() {
    if (isPortalLocked) {
      onLockedNavAttempt?.();
      return;
    }
    router.push(routes.communications);
  }

  return (
    <DropdownMenu
      align="end"
      contentClassName="w-[min(100vw-2rem,24rem)] min-w-[20rem] p-0 py-0"
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-5" />
          {badge ? (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </Button>
      }
    >
      <DropdownMenuLabel className="border-b border-[var(--color-border)] py-2">
        <p className="text-sm font-semibold text-[var(--color-heading)]">
          Notifications
        </p>
      </DropdownMenuLabel>
      <NotificationDropdownList items={topFive} loading={loading} />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={handleViewAll}
        className="justify-center py-2 font-medium text-[var(--color-primary)]"
      >
        View all notifications
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
