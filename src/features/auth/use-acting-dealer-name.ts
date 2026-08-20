"use client";

import { useCallback, useSyncExternalStore } from "react";

import { resolveActingDealerName } from "@/features/auth/acting-dealer";
import {
  getActingDealerId,
  getProfile,
  subscribeAuthStore,
} from "@/features/auth/token-store";
import { getGroupDealers } from "@/features/branches/api";
import type { GroupDealer } from "@/features/branches/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

/** Live header-selected dealer label for read-only Company / Dealership fields. */
export function useActingDealerName(): string {
  const profile = useSyncExternalStore(
    subscribeAuthStore,
    getProfile,
    () => null,
  );
  useSyncExternalStore(subscribeAuthStore, getActingDealerId, () => null);

  const isHolding = profile?.isGroupHoldingEntity === true;
  const loader = useCallback(() => getGroupDealers(), []);
  const { data: groupDealers } = useAsyncResource<GroupDealer[]>({
    key: isHolding ? "acting-dealer-name" : "acting-dealer-name|off",
    loader,
    enabled: isHolding,
  });

  return resolveActingDealerName(isHolding ? groupDealers : undefined);
}
