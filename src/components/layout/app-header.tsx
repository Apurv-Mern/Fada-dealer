"use client";

import { Check, ChevronDown, HelpCircle, LogOut, Menu, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { dealerLogout } from "@/features/auth/client-auth";
import type { GroupDealer } from "@/features/branches/types";
import { NotificationsBellDropdown } from "@/features/notifications/components/notifications-bell-dropdown";
import { routes } from "@/config/navigation";
import { toDisplayableFileUrl } from "@/lib/api";

export type AppHeaderProps = {
  userName?: string;
  userRole?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  /** Logged-in dealer id (the "you" row). */
  loggedInDealerId?: string;
  /** Currently selected dealer for `x-dealer-id`. */
  selectedDealerId?: string;
  /** Child group dealers — navbar list left of notifications. */
  groupDealers?: GroupDealer[];
  onDealerChange?: (dealerId: string) => void;
  onMenuClick?: () => void;
  isPortalLocked?: boolean;
  onLockedNavAttempt?: () => void;
  showSettingsLink?: boolean;
  showGroupDealerSwitch?: boolean;
};

function dealerLabel(name: string, dealerCode?: string) {
  return dealerCode ? `${name} (${dealerCode})` : name;
}

export function AppHeader({
  userName = "Company Admin",
  userRole = "Company Admin",
  userEmail,
  userAvatarUrl,
  loggedInDealerId,
  selectedDealerId,
  groupDealers,
  onDealerChange,
  onMenuClick,
  isPortalLocked = false,
  onLockedNavAttempt,
  showSettingsLink = true,
  showGroupDealerSwitch = true,
}: AppHeaderProps) {
  const router = useRouter();
  const signedInAs = userEmail?.trim() || userName;
  const showDealerships =
    showGroupDealerSwitch && Boolean(groupDealers && groupDealers.length > 0);
  const selfId = loggedInDealerId ?? "";
  const activeId = selectedDealerId || selfId;
  const selectedChild = groupDealers?.find((g) => g.id === activeId);
  const triggerLabel = selectedChild
    ? dealerLabel(selectedChild.name, selectedChild.dealerCode)
    : userName;

  function handleLogout() {
    dealerLogout();
    toast.success("Signed out");
    window.location.replace(routes.login);
  }

  function handleSettings() {
    if (isPortalLocked) {
      onLockedNavAttempt?.();
      return;
    }
    router.push(routes.settings);
  }

  function handleDealerSelect(dealerId: string) {
    if (!dealerId || dealerId === activeId) return;
    onDealerChange?.(dealerId);
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
        {showDealerships ? (
          <DropdownMenu
            contentClassName="min-w-[240px]"
            trigger={
              <button
                type="button"
                aria-label="Companies"
                className="flex h-10 max-w-[160px] min-w-0 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-left text-sm text-[var(--color-text)] outline-none sm:max-w-[220px] focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <span className="min-w-0 flex-1 truncate">{triggerLabel}</span>
                <ChevronDown
                  className="size-4 shrink-0 text-[var(--color-text-muted)]"
                  aria-hidden
                />
              </button>
            }
          >
            <DropdownMenuLabel>
              <p className="text-xs font-medium text-[var(--color-text)]">
                Companies
              </p>
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleDealerSelect(selfId)}
              className={selfId && activeId === selfId ? "font-medium" : undefined}
              aria-current={activeId === selfId ? "true" : undefined}
            >
              {activeId === selfId ? (
                <Check className="size-4 shrink-0 text-[var(--color-primary)]" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate">
                {dealerLabel(userName)}
                <span className="ml-1 font-normal text-[var(--color-text-muted)]">
                  (you)
                </span>
              </span>
            </DropdownMenuItem>
            {groupDealers!.map((g) => {
              const selected = g.id === activeId;
              return (
                <DropdownMenuItem
                  key={g.id}
                  onClick={() => handleDealerSelect(g.id)}
                  className={selected ? "font-medium" : undefined}
                  aria-current={selected ? "true" : undefined}
                >
                  {selected ? (
                    <Check className="size-4 shrink-0 text-[var(--color-primary)]" />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {dealerLabel(g.name, g.dealerCode)}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenu>
        ) : null}

        <NotificationsBellDropdown
          isPortalLocked={isPortalLocked}
          onLockedNavAttempt={onLockedNavAttempt}
        />

        <Tooltip content="Help">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="size-5" />
          </Button>
        </Tooltip>

        <div className="ml-1 flex items-center gap-3 border-l border-[var(--color-border)] pl-4">
          <DropdownMenu
            contentClassName="min-w-[200px]"
            trigger={
              <button
                type="button"
                className="flex items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                aria-label="Account menu"
              >
                <Avatar
                  name={userName}
                  src={toDisplayableFileUrl(userAvatarUrl) || undefined}
                  size="md"
                />
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
            <DropdownMenuLabel>
              <p className="text-xs font-medium text-[var(--color-text)]">
                Signed in as
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                {signedInAs}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {showSettingsLink ? (
              <>
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem destructive onClick={handleLogout}>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
