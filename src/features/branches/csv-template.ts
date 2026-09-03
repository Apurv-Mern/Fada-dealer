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

const REQUIRED_HEADERS = ["name", "brandName", "outletFunctions"] as const;

const PINCODE_PATTERN = /^\d{6}$/;

const EXAMPLE_ROW = [
  "Sanganer",
  "Maruti",
  "Sales|Service",
  "Shambhu",
  "303908",
  "Jaipur",
  "Rajasthan",
  "jaipur, kotkhawada",
] as const;

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Parse one CSV line into cells (handles quoted fields). */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
}

function parseOutletFunctions(raw: string): string[] {
  return raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Build UTF-8 CSV text for the outlet import template. */
export function buildOutletImportTemplateCsv(): string {
  const header = OUTLET_CSV_HEADERS.join(",");
  const row = EXAMPLE_ROW.map(escapeCsvCell).join(",");
  return `${header}\n${row}\n`;
}

/** Trigger a browser download of `outlet-import-template.csv`. */
export function downloadOutletImportTemplate(): void {
  const csv = buildOutletImportTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "outlet-import-template.csv";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^"|"$/g, "").toLowerCase();
}

function readHeaderIndex(headers: string[], key: string): number {
  const normalized = key.toLowerCase();
  return headers.findIndex((h) => normalizeHeader(h) === normalized);
}

function validateImportRow(
  rowNumber: number,
  values: Record<(typeof OUTLET_CSV_HEADERS)[number], string>,
): OutletImportRowError | null {
  const missing = REQUIRED_HEADERS.filter((key) => !values[key].trim());
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
      message: "outletFunctions must include at least one name (use Sales|Service)",
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

function rowToImportItem(
  values: Record<(typeof OUTLET_CSV_HEADERS)[number], string>,
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

/**
 * Light client check before upload: non-empty, looks like CSV, required headers present.
 */
export async function validateOutletImportCsv(
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

  const headers = parseCsvLine(firstLine).map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter(
    (key) => !headers.includes(key.toLowerCase()),
  );
  if (missing.length > 0) {
    return `CSV header must include: ${missing.join(", ")}`;
  }
  return null;
}

/**
 * Parse a CSV file into import items. Returns row-level validation errors.
 * Row numbers are 1-based CSV line numbers (header = row 1, first data = row 2).
 */
export async function parseOutletImportCsv(
  file: File,
): Promise<{ items: OutletImportItem[]; errors: OutletImportRowError[] }> {
  const fileError = await validateOutletImportCsv(file);
  if (fileError) {
    return { items: [], errors: [{ row: 1, message: fileError }] };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/);
  const headerLineIndex = lines.findIndex((line) => line.trim());
  if (headerLineIndex < 0) {
    return { items: [], errors: [{ row: 1, message: "CSV appears empty" }] };
  }

  const headerCells = parseCsvLine(lines[headerLineIndex]!);
  const headerIndexes = Object.fromEntries(
    OUTLET_CSV_HEADERS.map((key) => [key, readHeaderIndex(headerCells, key)]),
  ) as Record<(typeof OUTLET_CSV_HEADERS)[number], number>;

  const missingHeaders = OUTLET_CSV_HEADERS.filter(
    (key) => headerIndexes[key] < 0,
  );
  if (missingHeaders.length > 0) {
    return {
      items: [],
      errors: [
        {
          row: headerLineIndex + 1,
          message: `CSV header must include: ${missingHeaders.join(", ")}`,
        },
      ],
    };
  }

  const items: OutletImportItem[] = [];
  const errors: OutletImportRowError[] = [];

  for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (!line.trim()) continue;

    const rowNumber = i + 1;
    const cells = parseCsvLine(line);
    const values = Object.fromEntries(
      OUTLET_CSV_HEADERS.map((key) => [
        key,
        (cells[headerIndexes[key]] ?? "").trim(),
      ]),
    ) as Record<(typeof OUTLET_CSV_HEADERS)[number], string>;

    const rowError = validateImportRow(rowNumber, values);
    if (rowError) {
      errors.push(rowError);
      continue;
    }

    items.push(rowToImportItem(values));
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push({ row: 1, message: "CSV has no data rows" });
  }

  return { items, errors };
}
