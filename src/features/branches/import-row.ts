import type {
  OutletImportItem,
  OutletImportRowError,
} from "@/features/branches/types";

/** CSV headers matching Swagger DealerOutletImportItem (+ optional fields). */
export const OUTLET_CSV_HEADERS = [
  "name",
  "brandName",
  "outletFunctions",
  "manager",
  "pincode",
  "city",
  "state",
  "address",
] as const;

export type OutletImportRowValues = Record<
  (typeof OUTLET_CSV_HEADERS)[number],
  string
>;

export const OUTLET_REQUIRED_HEADERS = [
  "name",
  "brandName",
  "outletFunctions",
] as const;

const PINCODE_PATTERN = /^\d{6}$/;

export const OUTLET_IMPORT_WRONG_FILE_MESSAGE =
  "This is not an import file. Use Download CSV template or Download Excel template.";

export function parseOutletFunctions(raw: string): string[] {
  return raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function validateOutletImportRow(
  rowNumber: number,
  values: OutletImportRowValues,
): OutletImportRowError | null {
  const missing = OUTLET_REQUIRED_HEADERS.filter((key) => !values[key].trim());
  if (missing.length > 0) {
    return {
      row: rowNumber,
      message: `Missing required field(s): ${missing.join(", ")}`,
    };
  }

  const functions = parseOutletFunctions(values.outletFunctions);
  if (functions.length === 0) {
    return {
      row: rowNumber,
      message:
        "outletFunctions must include at least one name (use Sales|Service)",
    };
  }

  const pincode = values.pincode.trim();
  if (pincode && !PINCODE_PATTERN.test(pincode)) {
    return {
      row: rowNumber,
      message: "pincode must be 6 digits",
    };
  }

  return null;
}

export function outletRowToImportItem(
  values: OutletImportRowValues,
): OutletImportItem {
  const item: OutletImportItem = {
    name: values.name.trim(),
    brandName: values.brandName.trim(),
    outletFunctions: parseOutletFunctions(values.outletFunctions),
  };

  const manager = values.manager.trim();
  const pincode = values.pincode.trim();
  const city = values.city.trim();
  const state = values.state.trim();
  const address = values.address.trim();

  if (manager) item.manager = manager;
  if (pincode) item.pincode = pincode;
  if (city) item.city = city;
  if (state) item.state = state;
  if (address) item.address = address;

  return item;
}

export function isImportCommentLine(line: string): boolean {
  return line.trim().startsWith("#");
}

export function isBlankImportRow(values: OutletImportRowValues): boolean {
  return OUTLET_CSV_HEADERS.every((key) => !values[key].trim());
}

export function normalizeImportHeader(value: string): string {
  return value.trim().replace(/^"|"$/g, "").toLowerCase();
}

export function readImportHeaderIndex(headers: string[], key: string): number {
  const normalized = key.toLowerCase();
  return headers.findIndex((h) => normalizeImportHeader(h) === normalized);
}

export function detectWrongImportFileHeaders(headers: string[]): string | null {
  const normalized = headers.map(normalizeImportHeader);
  const hasType = normalized.includes("type");
  const hasName = normalized.includes("name");
  const hasBrandName = normalized.includes("brandname");
  const hasOutletFunctions = normalized.includes("outletfunctions");

  if (hasType && hasName && !hasBrandName && !hasOutletFunctions) {
    return OUTLET_IMPORT_WRONG_FILE_MESSAGE;
  }

  return null;
}

export function missingRequiredImportHeaders(headers: string[]): string[] {
  return OUTLET_REQUIRED_HEADERS.filter(
    (key) => !headers.map(normalizeImportHeader).includes(key.toLowerCase()),
  );
}

export function formatMissingImportHeadersError(missing: string[]): string {
  if (missing.length === 0) return "";
  return `File header must include: ${missing.join(", ")}. Use Download CSV template or Download Excel template.`;
}

export const OUTLET_IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;

export function isOutletCsvFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return lower.endsWith(".csv") || file.type === "text/csv";
}

export function isOutletXlsxFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith(".xlsx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
}

export function isOutletImportFile(file: File): boolean {
  return isOutletCsvFile(file) || isOutletXlsxFile(file);
}

export function outletImportFileTypeError(): string {
  return "Only CSV or Excel (.xlsx) files are supported";
}

export function outletImportFileSizeError(): string {
  return "Import file must be 2MB or smaller";
}
