"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useDealerPortalLock } from "@/features/auth/dealer-status-context";
import { usePermissions } from "@/features/auth/permissions-context";
import {
  getAllowedNavItems,
  getRoutePermission,
  routes,
} from "@/config/navigation";

export function PermissionRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLocked } = useDealerPortalLock();
  const { has, hasAny, profile } = usePermissions();

  useEffect(() => {
    if (!profile || isLocked) return;

    const required = getRoutePermission(pathname);
    if (!required) return;

    const allowed = Array.isArray(required)
      ? hasAny(required)
      : has(required as string);

    if (allowed) return;

    const fallback =
      getAllowedNavItems(has, hasAny).find((item) => item.href !== pathname)
        ?.href ?? routes.dealership;

    if (fallback && fallback !== pathname) {
      router.replace(fallback);
    }
  }, [pathname, profile, isLocked, has, hasAny, router]);

  return children;
}
