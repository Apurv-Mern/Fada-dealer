import {
  parseOutletImportCsv,
  validateOutletImportCsv,
  validateOutletImportItemsAgainstMasters,
} from "@/features/branches/csv-template";
import {
  parseOutletImportXlsx,
  validateOutletImportXlsx,
} from "@/features/branches/excel-template";
import { fetchOutletImportMasters } from "@/features/branches/import-masters";
import {
  isOutletCsvFile,
  isOutletImportFile,
  isOutletXlsxFile,
  outletImportFileTypeError,
} from "@/features/branches/import-row";
import type {
  OutletImportItem,
  OutletImportRowError,
} from "@/features/branches/types";

export async function validateOutletImportFile(
  file: File,
): Promise<string | null> {
  if (!isOutletImportFile(file)) return outletImportFileTypeError();
  if (isOutletCsvFile(file)) return validateOutletImportCsv(file);
  if (isOutletXlsxFile(file)) return validateOutletImportXlsx(file);
  return outletImportFileTypeError();
}

export async function parseOutletImportFile(file: File): Promise<{
  items: OutletImportItem[];
  errors: OutletImportRowError[];
}> {
  if (isOutletCsvFile(file)) return parseOutletImportCsv(file);
  if (isOutletXlsxFile(file)) return parseOutletImportXlsx(file);
  return {
    items: [],
    errors: [{ row: 1, message: outletImportFileTypeError() }],
  };
}

export async function validateParsedOutletImportAgainstMasters(
  items: OutletImportItem[],
): Promise<OutletImportRowError[]> {
  const masters = await fetchOutletImportMasters();
  return validateOutletImportItemsAgainstMasters(items, masters);
}

export class OutletImportMastersError extends Error {
  constructor(message = "Couldn't verify brands and functions. Try again.") {
    super(message);
    this.name = "OutletImportMastersError";
  }
}
