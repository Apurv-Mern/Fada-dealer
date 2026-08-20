import type { DealerProfile } from "@/features/dealership/types";
import { displayValue } from "@/features/dealership/types";
import type { MasterIdNameItem } from "@/features/masters/types";

/** Map brand master IDs to display names using the active catalog. */
export function brandNamesFromCatalog(
  brandIds: number[],
  catalog: MasterIdNameItem[],
): string[] {
  const byId = new Map(catalog.map((item) => [Number(item.id), item.name]));
  return brandIds.map((id) => byId.get(id) ?? `Brand #${id}`);
}

/** Fill brandsRepresented from brandIds when GET only returns numeric IDs. */
export function enrichProfileBrandNames(
  profile: DealerProfile,
  catalog: MasterIdNameItem[],
): DealerProfile {
  if (displayValue(profile.brandsRepresented)) {
    return profile;
  }
  if (profile.brandIds.length === 0) {
    return profile;
  }

  const names = brandNamesFromCatalog(profile.brandIds, catalog);
  return {
    ...profile,
    brandsRepresented: names.join(", "),
  };
}
