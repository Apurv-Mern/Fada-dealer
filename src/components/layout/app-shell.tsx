"use client";

import * as React from "react";
import { X } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import type { GroupDealer } from "@/features/branches/types";

export type AppShellProps = {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  loggedInDealerId?: string;
  selectedDealerId?: string;
  groupDealers?: GroupDealer[];
  onDealerChange?: (dealerId: string) => void;
  isPortalLocked?: boolean;
  onLockedNavAttempt?: () => void;
};

export function AppShell({
  children,
  userName,
  userRole,
  userEmail,
  loggedInDealerId,
  selectedDealerId,
  groupDealers,
  onDealerChange,
  isPortalLocked = false,
  onLockedNavAttempt,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const pageKey = selectedDealerId || loggedInDealerId || "main";

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-[var(--background)]">
      <div className="hidden lg:flex">
        <Sidebar
          locked={isPortalLocked}
          onLockedNavAttempt={onLockedNavAttempt}
        />
      </div>

      <Sheet
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        side="left"
        overlayClassName="lg:hidden"
      >
        <div className="relative h-full">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            className="absolute top-3 right-3 z-10"
            onClick={() => setMobileNavOpen(false)}
          >
            <X />
          </Button>
          <Sidebar
            className="h-full w-full border-r-0"
            onNavigate={() => setMobileNavOpen(false)}
            locked={isPortalLocked}
            onLockedNavAttempt={() => {
              setMobileNavOpen(false);
              onLockedNavAttempt?.();
            }}
          />
        </div>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          onMenuClick={() => setMobileNavOpen(true)}
          userName={userName}
          userRole={userRole}
          userEmail={userEmail}
          loggedInDealerId={loggedInDealerId}
          selectedDealerId={selectedDealerId}
          groupDealers={groupDealers}
          onDealerChange={onDealerChange}
          isPortalLocked={isPortalLocked}
          onLockedNavAttempt={onLockedNavAttempt}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          <div key={pageKey}>{children}</div>
        </main>
      </div>
    </div>
  );
}
