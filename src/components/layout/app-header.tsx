"use client";

import { Bell, HelpCircle, LogOut, Menu } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { dealerLogout } from "@/features/auth/client-auth";
import { routes } from "@/config/navigation";

export type AppHeaderProps = {
  notificationCount?: number;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  onMenuClick?: () => void;
};

export function AppHeader({
  notificationCount = 3,
  userName = "Dealer Admin",
  userRole = "Dealer Admin",
  userEmail,
  onMenuClick,
}: AppHeaderProps) {
  function handleLogout() {
    dealerLogout();
    toast.success("Signed out");
    window.location.assign(routes.login);
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Tooltip content="Open menu">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="size-5" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <Tooltip content="Notifications">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <Bell className="size-5" />
            {notificationCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            ) : null}
          </Button>
        </Tooltip>

        <Tooltip content="Help">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="size-5" />
          </Button>
        </Tooltip>

        <div className="ml-1 flex items-center gap-3 border-l border-[var(--color-border)] pl-4">
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                aria-label="Account menu"
              >
                <Avatar name={userName} size="md" />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-semibold text-[var(--color-heading)]">
                    {userName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {userRole}
                    {userEmail ? ` · ${userEmail}` : null}
                  </p>
                </div>
              </button>
            }
          >
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
