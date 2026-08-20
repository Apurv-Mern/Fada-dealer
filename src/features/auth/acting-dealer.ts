import type { GroupDealer } from "@/features/branches/types";
import { getActingDealerId, getProfile } from "@/features/auth/token-store";

/** Same label as the header dealer switcher: `Name (CODE)`. */
export function dealerDisplayName(name: string, dealerCode?: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "—";
  return dealerCode?.trim() ? `${trimmed} (${dealerCode.trim()})` : trimmed;
}

/**
 * Display name for the header-selected dealer.
 * Child match → group name; otherwise logged-in profile name.
 */
export function resolveActingDealerName(
  groupDealers?: GroupDealer[] | null,
): string {
  const profile = getProfile();
  const fallback = profile?.name?.trim() || "—";
  const actingId = getActingDealerId();
  if (!actingId || !groupDealers?.length) return fallback;
  const match = groupDealers.find((row) => row.id === actingId);
  if (!match) return fallback;
  return dealerDisplayName(match.name, match.dealerCode);
}
