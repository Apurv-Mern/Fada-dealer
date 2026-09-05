import {
  buildMasterNameLookup,
  buildOutletImportExampleValues,
  fetchOutletImportMasters,
  resolveMasterName,
  type OutletImportMasters,
} from "@/features/branches/import-masters";
import {
  escapeCsvCell,
  triggerCsvDownload,
} from "@/features/branches/import-file-utils";
import {
  detectWrongImportFileHeaders,
  formatMissingImportHeadersError,
  isBlankImportRow,
  isImportCommentLine,
  isOutletCsvFile,
  missingRequiredImportHeaders,
  normalizeImportHeader,
  OUTLET_CSV_HEADERS,
  OUTLET_IMPORT_MAX_FILE_BYTES,
  outletImportFileSizeError,
  outletImportFileTypeError,
  outletRowToImportItem,
  readImportHeaderIndex,
  validateOutletImportRow,
  type OutletImportRowValues,
} from "@/features/branches/import-row";
import type {
  OutletImportItem,
  OutletImportRowError,
} from "@/features/branches/types";

export {
  OUTLET_CSV_HEADERS,
  OUTLET_IMPORT_WRONG_FILE_MESSAGE,
  OUTLET_REQUIRED_HEADERS,
} from "@/features/branches/import-row";

export { escapeCsvCell } from "@/features/branches/import-file-utils";

const GENERIC_EXAMPLE_FIELDS = {
  name: "Sanganer",
  manager: "Shambhu",
  pincode: "303908",
  city: "Jaipur",
  state: "Rajasthan",
  address: "jaipur, kotkhawada",
} as const;

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

function buildReferenceCommentLines(masters: OutletImportMasters): string[] {
  const lines: string[] = [
    "",
    "# VALID BRANDS (exact spelling — do not import lines starting with #)",
  ];
  for (const brand of masters.brands) {
    lines.push(`# ${brand.name}`);
  }
  lines.push("# VALID OUTLET FUNCTIONS");
  for (const fn of masters.functions) {
    lines.push(`# ${fn.name}`);
  }
  return lines;
}

/** Build UTF-8 CSV text for the outlet import template using live masters. */
export function buildOutletImportTemplateCsv(
  masters: OutletImportMasters,
): string {
  const { brandName, outletFunctions } =
    buildOutletImportExampleValues(masters);
  const header = OUTLET_CSV_HEADERS.join(",");
  const exampleRow = [
    GENERIC_EXAMPLE_FIELDS.name,
    brandName,
    outletFunctions,
    GENERIC_EXAMPLE_FIELDS.manager,
    GENERIC_EXAMPLE_FIELDS.pincode,
    GENERIC_EXAMPLE_FIELDS.city,
    GENERIC_EXAMPLE_FIELDS.state,
    GENERIC_EXAMPLE_FIELDS.address,
  ]
    .map(escapeCsvCell)
    .join(",");

  const commentLines = buildReferenceCommentLines(masters);
  return `${header}\n${exampleRow}\n${commentLines.join("\n")}\n`;
}

/** Fetch masters and download `outlet-import-template.csv`. */
export async function downloadOutletImportTemplateCsv(): Promise<OutletImportMasters> {
  const masters = await fetchOutletImportMasters();
  const csv = buildOutletImportTemplateCsv(masters);
  triggerCsvDownload("outlet-import-template.csv", csv);
  return masters;
}

function rowValuesFromCells(
  cells: string[],
  headerIndexes: Record<(typeof OUTLET_CSV_HEADERS)[number], number>,
): OutletImportRowValues {
  return Object.fromEntries(
    OUTLET_CSV_HEADERS.map((key) => [
      key,
      String(cells[headerIndexes[key]] ?? "").trim(),
    ]),
  ) as OutletImportRowValues;
}

function parseCsvText(text: string): {
  items: OutletImportItem[];
  errors: OutletImportRowError[];
} {
  const lines = text.split(/\r?\n/);
  const headerLineIndex = lines.findIndex(
    (line) => line.trim() && !isImportCommentLine(line),
  );
  if (headerLineIndex < 0) {
    return { items: [], errors: [{ row: 1, message: "CSV appears empty" }] };
  }

  const headerCells = parseCsvLine(lines[headerLineIndex]!);
  const normalizedHeaders = headerCells.map(normalizeImportHeader);

  const wrongFile = detectWrongImportFileHeaders(normalizedHeaders);
  if (wrongFile) {
    return { items: [], errors: [{ row: 1, message: wrongFile }] };
  }

  const missing = missingRequiredImportHeaders(normalizedHeaders);
  if (missing.length > 0) {
    return {
      items: [],
      errors: [
        {
          row: headerLineIndex + 1,
          message: formatMissingImportHeadersError(missing),
        },
      ],
    };
  }

  const headerIndexes = Object.fromEntries(
    OUTLET_CSV_HEADERS.map((key) => [
      key,
      readImportHeaderIndex(headerCells, key),
    ]),
  ) as Record<(typeof OUTLET_CSV_HEADERS)[number], number>;

  const items: OutletImportItem[] = [];
  const errors: OutletImportRowError[] = [];

  for (let i = headerLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (!line.trim() || isImportCommentLine(line)) continue;

    const rowNumber = i + 1;
    const cells = parseCsvLine(line);
    const values = rowValuesFromCells(cells, headerIndexes);

    if (isBlankImportRow(values)) continue;

    const rowError = validateOutletImportRow(rowNumber, values);
    if (rowError) {
      errors.push(rowError);
      continue;
    }

    items.push(outletRowToImportItem(values));
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push({ row: 1, message: "CSV has no data rows" });
  }

  return { items, errors };
}

/**
 * Validate rows against live masters before POST.
 * Returns row errors; empty array means all rows match current API names.
 */
export function validateOutletImportItemsAgainstMasters(
  items: OutletImportItem[],
  masters: OutletImportMasters,
  rowOffset = 2,
): OutletImportRowError[] {
  const brandLookup = buildMasterNameLookup(masters.brands);
  const functionLookup = buildMasterNameLookup(masters.functions);
  const errors: OutletImportRowError[] = [];

  items.forEach((item, index) => {
    const row = rowOffset + index;
    const brand = resolveMasterName(item.brandName, brandLookup);
    if (!brand) {
      errors.push({
        row,
        message: `Brand '${item.brandName}' not found. Download a fresh template for valid names.`,
      });
      return;
    }

    for (const fn of item.outletFunctions) {
      const resolved = resolveMasterName(fn, functionLookup);
      if (!resolved) {
        errors.push({
          row,
          message: `Outlet function '${fn}' not found. Download a fresh template for valid names.`,
        });
      }
    }
  });

  return errors;
}

/**
 * Light client check before upload: non-empty, looks like CSV, required headers present.
 */
export async function validateOutletImportCsv(
  file: File,
): Promise<string | null> {
  if (!file.size) return "Choose a non-empty import file";
  if (!isOutletCsvFile(file)) return outletImportFileTypeError();
  if (file.size > OUTLET_IMPORT_MAX_FILE_BYTES) {
    return outletImportFileSizeError();
  }

  const text = await file.slice(0, 4096).text();
  const firstLine =
    text
      .split(/\r?\n/)
      .find((line) => line.trim() && !isImportCommentLine(line)) ?? "";
  if (!firstLine.trim()) return "CSV appears empty";

  const headers = parseCsvLine(firstLine).map(normalizeImportHeader);
  const wrongFile = detectWrongImportFileHeaders(headers);
  if (wrongFile) return wrongFile;

  const missing = missingRequiredImportHeaders(headers);
  if (missing.length > 0) {
    return formatMissingImportHeadersError(missing);
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
  return parseCsvText(text);
}

/** Parse CSV string (for tests). */
export function parseOutletImportCsvText(text: string): {
  items: OutletImportItem[];
  errors: OutletImportRowError[];
} {
  return parseCsvText(text);
}
