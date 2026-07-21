import { Bell, HelpCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export type AppHeaderProps = {
  notificationCount?: number;
  userName?: string;
  userRole?: string;
};

export function AppHeader({
  notificationCount = 3,
  userName = "Rajesh Sharma",
  userRole = "Dealer Admin",
}: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
        <Bell className="size-5" />
        {notificationCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
            {notificationCount}
          </span>
        ) : null}
      </Button>

      <Button variant="ghost" size="icon" aria-label="Help">
        <HelpCircle className="size-5" />
      </Button>

      <div className="ml-1 flex items-center gap-3 border-l border-[var(--color-border)] pl-4">
        <Avatar name={userName} size="md" />
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-[var(--color-heading)]">
            {userName}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">{userRole}</p>
        </div>
      </div>
    </header>
  );
}
