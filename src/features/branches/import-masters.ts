import { getBrands, getOutletFunctions } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";

export type OutletImportMasters = {
  brands: MasterIdNameItem[];
  functions: MasterIdNameItem[];
};

/** Fetch live brand and outlet-function masters for template download / import validation. */
export async function fetchOutletImportMasters(): Promise<OutletImportMasters> {
  const [brands, functions] = await Promise.all([
    getBrands(),
    getOutletFunctions(),
  ]);
  return { brands, functions };
}

export type OutletImportExampleValues = {
  brandName: string;
  outletFunctions: string;
};

function functionNames(functions: MasterIdNameItem[]): string[] {
  return functions.map((fn) => fn.name.trim()).filter(Boolean);
}

/** Build example cell values from live masters (no hardcoded brand/function names). */
export function buildOutletImportExampleValues(
  masters: OutletImportMasters,
): OutletImportExampleValues {
  const brandName = masters.brands[0]?.name ?? "";
  const names = functionNames(masters.functions);

  let outletFunctions = "";
  if (names.length >= 2) {
    outletFunctions = `${names[0]}|${names[1]}`;
  } else if (names.length === 1) {
    outletFunctions = names[0]!;
  }

  return { brandName, outletFunctions };
}

/**
 * Excel example uses a single function name so the cell matches the dropdown list.
 * Multi-function `|` syntax is documented on the Instructions sheet.
 */
export function buildOutletImportExcelExampleValues(
  masters: OutletImportMasters,
): OutletImportExampleValues {
  return {
    brandName: masters.brands[0]?.name ?? "",
    outletFunctions: functionNames(masters.functions)[0] ?? "",
  };
}

export type MasterNameLookup = ReadonlyMap<string, string>;

/** Case-insensitive name → canonical name from masters. */
export function buildMasterNameLookup(
  items: MasterIdNameItem[],
): MasterNameLookup {
  const map = new Map<string, string>();
  for (const item of items) {
    const name = item.name.trim();
    if (!name) continue;
    map.set(name.toLowerCase(), name);
  }
  return map;
}

export function resolveMasterName(
  raw: string,
  lookup: MasterNameLookup,
): string | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return lookup.get(key) ?? null;
}

export function mastersHaveDropdownData(masters: OutletImportMasters): boolean {
  return masters.brands.length > 0 || masters.functions.length > 0;
}
