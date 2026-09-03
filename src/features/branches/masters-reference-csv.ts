import { getBrands, getOutletFunctions } from "@/features/masters/api";

export const OUTLET_MASTERS_REFERENCE_CSV_HEADERS = ["type", "name"] as const;

export type OutletMastersReferenceRow = {
  type: "brand" | "outletFunction";
  name: string;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function triggerCsvDownload(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Build UTF-8 CSV text for brand / outlet function name lookup. */
export function buildOutletMastersReferenceCsv(
  rows: OutletMastersReferenceRow[],
): string {
  const header = OUTLET_MASTERS_REFERENCE_CSV_HEADERS.join(",");
  const lines = rows.map((row) =>
    [row.type, row.name].map(escapeCsvCell).join(","),
  );
  return `${header}\n${lines.join("\n")}${lines.length ? "\n" : ""}`;
}

/** Fetch live masters and return reference rows. */
export async function fetchOutletMastersReferenceRows(): Promise<
  OutletMastersReferenceRow[]
> {
  const [brands, outletFunctions] = await Promise.all([
    getBrands(),
    getOutletFunctions(),
  ]);

  const rows: OutletMastersReferenceRow[] = [];

  for (const brand of brands) {
    rows.push({
      type: "brand",
      name: brand.name,
    });
  }

  for (const fn of outletFunctions) {
    rows.push({
      type: "outletFunction",
      name: fn.name,
    });
  }

  return rows;
}

/**
 * Fetch brands/outlet functions from dealer APIs and download
 * `outlet-import-reference.csv`.
 * @returns number of data rows written (0 = header only)
 */
export async function downloadOutletMastersReferenceCsv(): Promise<number> {
  const rows = await fetchOutletMastersReferenceRows();
  const csv = buildOutletMastersReferenceCsv(rows);
  triggerCsvDownload("outlet-import-reference.csv", csv);
  return rows.length;
}
