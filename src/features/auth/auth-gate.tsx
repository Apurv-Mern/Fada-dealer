"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { isLoggedIn, subscribeAuthStore } from "@/features/auth/token-store";
import { routes } from "@/config/navigation";

/** Redirects authenticated users away from auth pages (no skeleton flash). */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const loggedIn = useSyncExternalStore(
    subscribeAuthStore,
    isLoggedIn,
    () => false,
  );

  useEffect(() => {
    if (loggedIn) {
      router.replace(routes.branches);
    }
  }, [loggedIn, router]);

  return children;
}
