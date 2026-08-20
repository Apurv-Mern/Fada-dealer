"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { PageSkeleton } from "@/components/layout/page-skeleton";
import { SectionError } from "@/components/layout/section-error";
import { routes } from "@/config/navigation";
import { PendingApprovalDialog } from "@/features/auth/components/pending-approval-dialog";
import { getDealerProfile } from "@/features/dealership/api";
import type { DealerProfile } from "@/features/dealership/types";
import type { DealerAccountStatus } from "@/features/dealership/status";
import {
  isDealerPortalLocked,
  parseDealerAccountStatus,
} from "@/features/dealership/status";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

type StatusSnapshot = {
  dealerId: string;
  profile: DealerProfile;
};

export type DealerPortalLockValue = {
  /** Confirmed account status, or pending while unknown. */
  status: DealerAccountStatus;
  /**
   * True when nav must stay locked (loading, error, or not approved).
   * Conservative until status is confirmed approved for the acting dealer.
   */
  isLocked: boolean;
  /** True after a successful fetch confirms status !== approved. */
  isConfirmedLocked: boolean;
  loading: boolean;
  error: string | null;
  retry: () => void;
  showLockDialog: () => void;
};

const DealerPortalLockContext = createContext<DealerPortalLockValue | null>(
  null,
);

function isDealershipRoute(pathname: string): boolean {
  return (
    pathname === routes.dealership ||
    pathname === `${routes.dealership}/` ||
    pathname.startsWith(`${routes.dealership}/`)
  );
}

export function DealerStatusProvider({
  actingDealerId,
  children,
}: {
  actingDealerId: string | null;
  children: React.ReactNode;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dealerKey = actingDealerId ?? "self";
  const loader = useCallback(async (): Promise<StatusSnapshot> => {
    const profile = await getDealerProfile();
    return { dealerId: dealerKey, profile };
  }, [dealerKey]);

  const { data, error, loading, retry } = useAsyncResource({
    key: `dealer-portal-status|${dealerKey}`,
    loader,
    enabled: true,
  });

  const fresh = data?.dealerId === dealerKey;
  const status = parseDealerAccountStatus(
    fresh ? data.profile.status : "pending",
  );
  const isConfirmedLocked =
    fresh && !loading && !error && isDealerPortalLocked(status);
  const isLocked =
    loading || Boolean(error) || !fresh || isDealerPortalLocked(status);

  useEffect(() => {
    function onFocus() {
      retry();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [retry]);

  const showLockDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const value = useMemo<DealerPortalLockValue>(
    () => ({
      status,
      isLocked,
      isConfirmedLocked,
      loading: loading || !fresh,
      error,
      retry,
      showLockDialog,
    }),
    [
      status,
      isLocked,
      isConfirmedLocked,
      loading,
      fresh,
      error,
      retry,
      showLockDialog,
    ],
  );

  return (
    <DealerPortalLockContext.Provider value={value}>
      {children}
      <PendingApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        status={status}
      />
    </DealerPortalLockContext.Provider>
  );
}

/** Guards portal `<main>` only — keeps sidebar/header mounted. */
export function DealerPortalRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, error, retry, isConfirmedLocked } = useDealerPortalLock();

  useEffect(() => {
    if (loading || error) return;
    if (isConfirmedLocked && !isDealershipRoute(pathname)) {
      router.replace(routes.dealership);
    }
  }, [loading, error, isConfirmedLocked, pathname, router]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <SectionError
        title="Couldn't verify company status"
        description={error}
        onRetry={retry}
      />
    );
  }

  if (isConfirmedLocked && !isDealershipRoute(pathname)) {
    return <PageSkeleton />;
  }

  return children;
}

export function useDealerPortalLock(): DealerPortalLockValue {
  const value = useContext(DealerPortalLockContext);
  if (!value) {
    throw new Error(
      "useDealerPortalLock must be used within DealerStatusProvider",
    );
  }
  return value;
}

/** Safe for chrome that may render before the provider exists. */
export function useDealerPortalLockOptional(): DealerPortalLockValue | null {
  return useContext(DealerPortalLockContext);
}
