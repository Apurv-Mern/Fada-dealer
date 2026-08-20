/** CSV header matching dealer create / import contract (Add Employee form). */
export const EMPLOYEE_CSV_HEADERS = [
  "name",
  "email",
  "phone",
  "departmentId",
  "designationId",
  "outletId",
  "score",
  "isActive",
  "joinedDate",
] as const;

const EXAMPLE_ROW = [
  "Rahul Sharma",
  "rahul@example.com",
  "9876543210",
  "2",
  "4",
  "12",
  "0",
  "true",
  "2024-06-01",
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Build UTF-8 CSV text for the employee import template. */
export function buildEmployeeImportTemplateCsv(): string {
  const header = EMPLOYEE_CSV_HEADERS.join(",");
  const row = EXAMPLE_ROW.map(escapeCsvCell).join(",");
  return `${header}\n${row}\n`;
}

/** Trigger a browser download of `employee-import-template.csv`. */
export function downloadEmployeeImportTemplate(): void {
  const csv = buildEmployeeImportTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "employee-import-template.csv";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Light client check before upload: non-empty, looks like CSV, header has `name`.
 */
export async function validateEmployeeImportCsv(
  file: File,
): Promise<string | null> {
  if (!file.size) return "Choose a non-empty CSV file";
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".csv") && file.type !== "text/csv") {
    return "Only CSV files are supported";
  }
  if (file.size > 2 * 1024 * 1024) {
    return "CSV must be 2MB or smaller";
  }

  const text = await file.slice(0, 4096).text();
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  if (!firstLine.trim()) return "CSV appears empty";

  const headers = firstLine
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  if (!headers.includes("name")) {
    return "CSV header must include a name column";
  }
  return null;
}
