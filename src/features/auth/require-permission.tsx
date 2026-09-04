"use client";

import type { ReactNode } from "react";

import { usePermissions } from "@/features/auth/permissions-context";

export function RequirePermission({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: string;
  anyOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { has, hasAny } = usePermissions();

  const allowed = permission
    ? has(permission)
    : anyOf
      ? hasAny(anyOf)
      : true;

  if (!allowed) return fallback;
  return children;
}
