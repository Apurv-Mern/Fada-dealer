"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  getProfile,
  isLoggedIn,
  subscribeAuthStore,
} from "@/features/auth/token-store";
import { routes } from "@/config/navigation";

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

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    if (!ready || loggedIn) return;
    const next = pathname && pathname !== "/" ? pathname : routes.branches;
    router.replace(`${routes.login}?next=${encodeURIComponent(next)}`);
  }, [ready, loggedIn, pathname, router]);

  // Until client-ready, keep AppShell chrome (avoids full-page skeleton → shell flash).
  if (!ready || !loggedIn) {
    return (
      <AppShell
        userName={ready ? profile?.name : undefined}
        userRole={ready ? profile?.role : undefined}
        userEmail={ready ? profile?.email : undefined}
      >
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell
      userName={profile?.name}
      userRole={profile?.role}
      userEmail={profile?.email}
    >
      {children}
    </AppShell>
  );
}
