"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import type { SessionPayload } from "@/features/auth/auth-utils";
import {
  canAccessSettings,
  canManageRoles,
  canManageStaff,
  hasAnyPermission,
  hasPermission,
  isPrimaryDealer,
  type DealerPermission,
} from "@/features/auth/permissions";
import { getProfile, subscribeAuthStore } from "@/features/auth/token-store";

type PermissionsContextValue = {
  profile: SessionPayload | null;
  permissions: string[];
  isPrimaryDealer: boolean;
  isSuperRole: boolean;
  has: (key: string) => boolean;
  hasAny: (keys: readonly string[]) => boolean;
  canAccessSettings: boolean;
  canManageStaff: boolean;
  canManageRoles: boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );

  const permissions = profile?.permissions ?? [];
  const isSuperRole = profile?.isSuperRole === true;

  const has = useCallback(
    (key: string) =>
      hasPermission(permissions, key, { isSuperRole }),
    [permissions, isSuperRole],
  );

  const hasAny = useCallback(
    (keys: readonly string[]) =>
      hasAnyPermission(permissions, keys, { isSuperRole }),
    [permissions, isSuperRole],
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({
      profile,
      permissions,
      isPrimaryDealer: isPrimaryDealer(profile),
      isSuperRole,
      has,
      hasAny,
      canAccessSettings: canAccessSettings(profile),
      canManageStaff: canManageStaff(profile),
      canManageRoles: canManageRoles(profile),
    }),
    [profile, permissions, isSuperRole, has, hasAny],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return ctx;
}

export function useOptionalPermissions(): PermissionsContextValue | null {
  return useContext(PermissionsContext);
}

export function useHasPermission(key: DealerPermission | string): boolean {
  const { has } = usePermissions();
  return has(key);
}
