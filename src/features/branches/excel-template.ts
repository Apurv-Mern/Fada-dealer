import ExcelJS from "exceljs";

import { triggerXlsxDownload } from "@/features/branches/import-file-utils";
import {
  buildOutletImportExcelExampleValues,
  fetchOutletImportMasters,
  mastersHaveDropdownData,
  type OutletImportMasters,
} from "@/features/branches/import-masters";
import {
  detectWrongImportFileHeaders,
  formatMissingImportHeadersError,
  isBlankImportRow,
  isImportCommentLine,
  isOutletXlsxFile,
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

export const OUTLET_IMPORT_SHEET_NAME = "Outlets";
export const OUTLET_LISTS_SHEET_NAME = "Lists";
export const OUTLET_INSTRUCTIONS_SHEET_NAME = "Instructions";

export const OUTLET_IMPORT_BRANDS_NAME = "OutletImportBrands";
export const OUTLET_IMPORT_FUNCTIONS_NAME = "OutletImportFunctions";

const GENERIC_EXAMPLE_FIELDS = {
  name: "Sanganer",
  manager: "Shambhu",
  pincode: "303908",
  city: "Jaipur",
  state: "Rajasthan",
  address: "jaipur, kotkhawada",
} as const;

const DATA_ROW_START = 2;
const DATA_ROW_END = 500;

type WorksheetWithDataValidations = ExcelJS.Worksheet & {
  dataValidations: {
    add: (address: string, validation: ExcelJS.DataValidation) => void;
    model: Record<string, ExcelJS.DataValidation | undefined>;
  };
};

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value && value.result != null) return String(value.result);
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text ?? "").join("");
    }
    return String(value);
  }
  return String(value).trim();
}

function listValidation(namedRangeFormula: string): ExcelJS.DataValidation {
  return {
    type: "list",
    allowBlank: true,
    formulae: [namedRangeFormula],
    showInputMessage: true,
    promptTitle: "Choose a value",
    prompt:
      "Pick from the list or type a valid name (use | for multiple functions).",
    showErrorMessage: true,
    errorStyle: "warning",
    errorTitle: "Invalid value",
    error:
      "Pick from the list or type a valid name (use | for multiple functions).",
  };
}

function populateListsSheet(
  listsSheet: ExcelJS.Worksheet,
  masters: OutletImportMasters,
) {
  masters.brands.forEach((brand, index) => {
    listsSheet.getCell(index + 1, 1).value = brand.name;
  });
  masters.functions.forEach((fn, index) => {
    listsSheet.getCell(index + 1, 2).value = fn.name;
  });
}

function registerNamedListRanges(
  workbook: ExcelJS.Workbook,
  masters: OutletImportMasters,
) {
  if (masters.brands.length > 0) {
    workbook.definedNames.add(
      `${OUTLET_LISTS_SHEET_NAME}!$A$1:$A$${masters.brands.length}`,
      OUTLET_IMPORT_BRANDS_NAME,
    );
  }
  if (masters.functions.length > 0) {
    workbook.definedNames.add(
      `${OUTLET_LISTS_SHEET_NAME}!$B$1:$B$${masters.functions.length}`,
      OUTLET_IMPORT_FUNCTIONS_NAME,
    );
  }
}

function applyColumnListValidations(
  outletsSheet: ExcelJS.Worksheet,
  masters: OutletImportMasters,
) {
  const sheet = outletsSheet as WorksheetWithDataValidations;
  const brandRange = `B${DATA_ROW_START}:B${DATA_ROW_END}`;
  const functionRange = `C${DATA_ROW_START}:C${DATA_ROW_END}`;

  if (masters.brands.length > 0) {
    sheet.dataValidations.add(
      brandRange,
      listValidation(`=${OUTLET_IMPORT_BRANDS_NAME}`),
    );
  }
  if (masters.functions.length > 0) {
    sheet.dataValidations.add(
      functionRange,
      listValidation(`=${OUTLET_IMPORT_FUNCTIONS_NAME}`),
    );
  }
}

function writeInstructionsSheet(
  sheet: ExcelJS.Worksheet,
  masters: OutletImportMasters,
) {
  const lines = [
    "Outlet import template",
    "",
    "1. Fill rows on the Outlets sheet (keep the header row).",
    "2. Use dropdowns for brandName and outletFunctions where available.",
    "3. For multiple outlet functions, type names separated by | (pipe), e.g. Sales|Service.",
    "4. Upload this .xlsx file directly, or save as CSV and upload.",
    "",
    `Brands available: ${masters.brands.length}`,
    `Outlet functions available: ${masters.functions.length}`,
  ];

  if (!mastersHaveDropdownData(masters)) {
    lines.push(
      "",
      "Warning: No brands or outlet functions were returned from the API.",
      "Download again later or contact support if dropdowns are empty.",
    );
  }

  lines.forEach((line, index) => {
    sheet.getCell(index + 1, 1).value = line;
  });
  sheet.getColumn(1).width = 90;
}

/** Build an Excel workbook buffer for the outlet import template. */
export async function buildOutletImportTemplateXlsx(
  masters: OutletImportMasters,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();

  // Lists first so named ranges / validation targets exist before Outlets.
  const listsSheet = workbook.addWorksheet(OUTLET_LISTS_SHEET_NAME);
  listsSheet.state = "hidden";
  populateListsSheet(listsSheet, masters);
  registerNamedListRanges(workbook, masters);

  const outletsSheet = workbook.addWorksheet(OUTLET_IMPORT_SHEET_NAME);
  outletsSheet.addRow([...OUTLET_CSV_HEADERS]);

  const { brandName, outletFunctions } =
    buildOutletImportExcelExampleValues(masters);
  outletsSheet.addRow([
    GENERIC_EXAMPLE_FIELDS.name,
    brandName,
    outletFunctions,
    GENERIC_EXAMPLE_FIELDS.manager,
    GENERIC_EXAMPLE_FIELDS.pincode,
    GENERIC_EXAMPLE_FIELDS.city,
    GENERIC_EXAMPLE_FIELDS.state,
    GENERIC_EXAMPLE_FIELDS.address,
  ]);

  OUTLET_CSV_HEADERS.forEach((_, index) => {
    outletsSheet.getColumn(index + 1).width = index === 0 ? 24 : 18;
  });

  applyColumnListValidations(outletsSheet, masters);

  const instructionsSheet = workbook.addWorksheet(
    OUTLET_INSTRUCTIONS_SHEET_NAME,
  );
  writeInstructionsSheet(instructionsSheet, masters);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

/** Fetch masters and download `outlet-import-template.xlsx`. */
export async function downloadOutletImportTemplateXlsx(): Promise<OutletImportMasters> {
  const masters = await fetchOutletImportMasters();
  const buffer = await buildOutletImportTemplateXlsx(masters);
  triggerXlsxDownload("outlet-import-template.xlsx", buffer);
  return masters;
}

function resolveImportSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | null {
  const named = workbook.getWorksheet(OUTLET_IMPORT_SHEET_NAME);
  if (named) return named;
  return workbook.worksheets[0] ?? null;
}

function rowValuesFromExcelRow(
  row: ExcelJS.Row,
  headerIndexes: Record<(typeof OUTLET_CSV_HEADERS)[number], number>,
): OutletImportRowValues {
  return Object.fromEntries(
    OUTLET_CSV_HEADERS.map((key) => {
      const index = headerIndexes[key];
      const cell = index >= 0 ? row.getCell(index + 1) : null;
      return [key, cellText(cell?.value)];
    }),
  ) as OutletImportRowValues;
}

function parseWorksheetRows(sheet: ExcelJS.Worksheet): {
  items: OutletImportItem[];
  errors: OutletImportRowError[];
} {
  const headerRow = sheet.getRow(1);
  const headerCells = OUTLET_CSV_HEADERS.map((_, index) =>
    cellText(headerRow.getCell(index + 1).value),
  );

  const firstNonEmptyHeaders = headerCells.some(Boolean)
    ? headerCells
    : OUTLET_CSV_HEADERS.map((key, index) => {
        const value = cellText(sheet.getRow(1).getCell(index + 1).value);
        return value || key;
      });

  const normalizedHeaders = firstNonEmptyHeaders.map(normalizeImportHeader);

  const wrongFile = detectWrongImportFileHeaders(normalizedHeaders);
  if (wrongFile) {
    return { items: [], errors: [{ row: 1, message: wrongFile }] };
  }

  const missing = missingRequiredImportHeaders(normalizedHeaders);
  if (missing.length > 0) {
    return {
      items: [],
      errors: [{ row: 1, message: formatMissingImportHeadersError(missing) }],
    };
  }

  const headerIndexes = Object.fromEntries(
    OUTLET_CSV_HEADERS.map((key) => [
      key,
      readImportHeaderIndex(firstNonEmptyHeaders, key),
    ]),
  ) as Record<(typeof OUTLET_CSV_HEADERS)[number], number>;

  const items: OutletImportItem[] = [];
  const errors: OutletImportRowError[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const firstCell = cellText(row.getCell(1).value);
    if (isImportCommentLine(firstCell)) return;

    const values = rowValuesFromExcelRow(row, headerIndexes);
    if (isBlankImportRow(values)) return;

    const rowError = validateOutletImportRow(rowNumber, values);
    if (rowError) {
      errors.push(rowError);
      return;
    }

    items.push(outletRowToImportItem(values));
  });

  if (items.length === 0 && errors.length === 0) {
    errors.push({ row: 1, message: "Import file has no data rows" });
  }

  return { items, errors };
}

export async function validateOutletImportXlsx(
  file: File,
): Promise<string | null> {
  if (!file.size) return "Choose a non-empty import file";
  if (!isOutletXlsxFile(file)) return outletImportFileTypeError();
  if (file.size > OUTLET_IMPORT_MAX_FILE_BYTES) {
    return outletImportFileSizeError();
  }

  const workbook = new ExcelJS.Workbook();
  try {
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
  } catch {
    return "Could not read Excel file";
  }

  const sheet = resolveImportSheet(workbook);
  if (!sheet) return "Excel file has no worksheets";

  const headerCells = OUTLET_CSV_HEADERS.map((_, index) =>
    cellText(sheet.getRow(1).getCell(index + 1).value),
  );
  const normalizedHeaders = headerCells.map(normalizeImportHeader);

  const wrongFile = detectWrongImportFileHeaders(normalizedHeaders);
  if (wrongFile) return wrongFile;

  const missing = missingRequiredImportHeaders(normalizedHeaders);
  if (missing.length > 0) {
    return formatMissingImportHeadersError(missing);
  }

  return null;
}

export async function parseOutletImportXlsx(
  file: File,
): Promise<{ items: OutletImportItem[]; errors: OutletImportRowError[] }> {
  const fileError = await validateOutletImportXlsx(file);
  if (fileError) {
    return { items: [], errors: [{ row: 1, message: fileError }] };
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheet = resolveImportSheet(workbook);
  if (!sheet) {
    return {
      items: [],
      errors: [{ row: 1, message: "Excel file has no worksheets" }],
    };
  }

  return parseWorksheetRows(sheet);
}

/** Parse workbook buffer (for tests). */
export async function parseOutletImportXlsxBuffer(
  buffer: ArrayBuffer,
): Promise<{ items: OutletImportItem[]; errors: OutletImportRowError[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = resolveImportSheet(workbook);
  if (!sheet) {
    return {
      items: [],
      errors: [{ row: 1, message: "Excel file has no worksheets" }],
    };
  }
  return parseWorksheetRows(sheet);
}
