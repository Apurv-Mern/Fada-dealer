"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { resolvePortalDestination } from "@/features/auth/resolve-portal-destination";
import { isLoggedIn } from "@/features/auth/token-store";
import { routes } from "@/config/navigation";
import { messageFromApiError } from "@/lib/api/errors";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isLoggedIn()) {
        router.replace(routes.login);
        return;
      }
      try {
        const dest = await resolvePortalDestination();
        if (!cancelled) router.replace(dest);
      } catch (err) {
        if (!cancelled) {
          toast.error(
            messageFromApiError(err) ||
              "Couldn't verify company status. Please try again.",
          );
          router.replace(routes.login);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 p-6"
      aria-busy
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
