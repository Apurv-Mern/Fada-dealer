import { getOutletOptions } from "@/features/branches/api";
import { getDepartments, getDesignations } from "@/features/masters/api";

export const MASTERS_REFERENCE_CSV_HEADERS = [
  "type",
  "name",
  "department",
  "outletCode",
] as const;

export type MastersReferenceRow = {
  type: "department" | "designation" | "outlet";
  name: string;
  department?: string;
  outletCode?: string;
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

/** Build UTF-8 CSV text for department / designation / outlet name lookup. */
export function buildEmployeeMastersReferenceCsv(
  rows: MastersReferenceRow[],
): string {
  const header = MASTERS_REFERENCE_CSV_HEADERS.join(",");
  const lines = rows.map((row) =>
    [row.type, row.name, row.department ?? "", row.outletCode ?? ""]
      .map(escapeCsvCell)
      .join(","),
  );
  return `${header}\n${lines.join("\n")}${lines.length ? "\n" : ""}`;
}

/** Fetch live masters + outlets and return reference rows. */
export async function fetchEmployeeMastersReferenceRows(): Promise<
  MastersReferenceRow[]
> {
  const [departments, outlets] = await Promise.all([
    getDepartments(),
    getOutletOptions(),
  ]);

  const designationGroups = await Promise.all(
    departments.map(async (dept) => {
      const designations = await getDesignations(dept.id);
      return { dept, designations };
    }),
  );

  const rows: MastersReferenceRow[] = [];

  for (const dept of departments) {
    rows.push({
      type: "department",
      name: dept.name,
    });
  }

  for (const { dept, designations } of designationGroups) {
    for (const desig of designations) {
      rows.push({
        type: "designation",
        name: desig.name,
        department: dept.name,
      });
    }
  }

  for (const outlet of outlets) {
    rows.push({
      type: "outlet",
      name: outlet.label,
      outletCode: outlet.outletCode,
    });
  }

  return rows;
}

/**
 * Fetch masters/outlets from dealer APIs and download
 * `employee-import-reference.csv`.
 * @returns number of data rows written (0 = header only)
 */
export async function downloadEmployeeMastersReferenceCsv(): Promise<number> {
  const rows = await fetchEmployeeMastersReferenceRows();
  const csv = buildEmployeeMastersReferenceCsv(rows);
  triggerCsvDownload("employee-import-reference.csv", csv);
  return rows.length;
}
