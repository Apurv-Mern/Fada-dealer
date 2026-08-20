"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { isLoggedIn, subscribeAuthStore } from "@/features/auth/token-store";
import { resolvePortalDestination } from "@/features/auth/resolve-portal-destination";
import { toast } from "@/components/ui/toast";
import { messageFromApiError } from "@/lib/api/errors";

/** Redirects authenticated users away from auth pages (no skeleton flash). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const loggedIn = useSyncExternalStore(
    subscribeAuthStore,
    isLoggedIn,
    () => false,
  );

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const dest = await resolvePortalDestination();
        if (!cancelled) router.replace(dest);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            messageFromApiError(err) ||
              "Couldn't verify company status. Please try again.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, router]);

  return children;
}
