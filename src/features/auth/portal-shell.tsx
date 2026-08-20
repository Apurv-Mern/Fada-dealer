"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getGroupDealers } from "@/features/branches/api";
import type { GroupDealer } from "@/features/branches/types";
import {
  DealerPortalRouteGuard,
  DealerStatusProvider,
  useDealerPortalLock,
} from "@/features/auth/dealer-status-context";
import {
  getActingDealerId,
  getProfile,
  isLoggedIn,
  setActingDealerId,
  subscribeAuthStore,
} from "@/features/auth/token-store";
import { NotificationsProvider } from "@/features/notifications/notifications-context";
import { routes } from "@/config/navigation";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

/** Client-only readiness (false on server / first SSR snapshot). */
function subscribeReady() {
  return () => {};
}
function getClientReady() {
  return true;
}
function getServerReady() {
  return false;
}

function PortalAppShell({ children }: { children: React.ReactNode }) {
  const { isLocked, showLockDialog } = useDealerPortalLock();
  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );
  const actingDealerId = useSyncExternalStore(
    subscribeAuthStore,
    getActingDealerId,
    () => null,
  );

  const isHolding = profile?.isGroupHoldingEntity === true;
  const groupsLoader = useCallback(() => getGroupDealers(), []);
  const { data: groupDealers } = useAsyncResource<GroupDealer[]>({
    key: isHolding ? "nav-group-dealers" : "nav-group-dealers|off",
    loader: groupsLoader,
    enabled: isHolding,
  });

  const selfId = profile?.id ?? "";
  const navGroupDealers =
    isHolding && groupDealers && groupDealers.length > 0
      ? groupDealers
      : undefined;

  useEffect(() => {
    if (!selfId || !groupDealers) return;
    const allowed = new Set(groupDealers.map((g) => g.id));
    allowed.add(selfId);
    if (actingDealerId && !allowed.has(actingDealerId)) {
      setActingDealerId(selfId);
    }
  }, [selfId, groupDealers, actingDealerId]);

  return (
    <AppShell
      userName={profile?.name}
      userRole={profile?.role}
      userEmail={profile?.email}
      loggedInDealerId={selfId || undefined}
      selectedDealerId={actingDealerId ?? undefined}
      groupDealers={navGroupDealers}
      onDealerChange={setActingDealerId}
      isPortalLocked={isLocked}
      onLockedNavAttempt={showLockDialog}
    >
      <DealerPortalRouteGuard>{children}</DealerPortalRouteGuard>
    </AppShell>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribeReady,
    getClientReady,
    getServerReady,
  );
  const loggedIn = useSyncExternalStore(
    subscribeAuthStore,
    isLoggedIn,
    () => false,
  );
  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );
  const actingDealerId = useSyncExternalStore(
    subscribeAuthStore,
    getActingDealerId,
    () => null,
  );

  useEffect(() => {
    if (!ready || loggedIn) return;
    // Always go to a clean login URL (no ?next=). Preserving the current
    // pathname (e.g. /settings) after Logout would send users back there
    // on the next sign-in.
    router.replace(routes.login);
  }, [ready, loggedIn, router]);

  // Until client-ready, keep AppShell chrome (avoids full-page skeleton → shell flash).
  if (!ready || !loggedIn) {
    return (
      <AppShell
        userName={ready ? profile?.name : undefined}
        userRole={ready ? profile?.role : undefined}
        userEmail={ready ? profile?.email : undefined}
        loggedInDealerId={ready ? profile?.id : undefined}
        selectedDealerId={ready ? (actingDealerId ?? undefined) : undefined}
      >
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <DealerStatusProvider actingDealerId={actingDealerId}>
      <NotificationsProvider actingDealerId={actingDealerId}>
        <PortalAppShell>{children}</PortalAppShell>
      </NotificationsProvider>
    </DealerStatusProvider>
  );
}
