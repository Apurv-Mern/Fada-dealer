import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";

import {
  OUTLET_IMPORT_BRANDS_NAME,
  OUTLET_IMPORT_FUNCTIONS_NAME,
  OUTLET_IMPORT_SHEET_NAME,
  OUTLET_LISTS_SHEET_NAME,
  buildOutletImportTemplateXlsx,
  parseOutletImportXlsxBuffer,
} from "@/features/branches/excel-template";
import {
  mockBrands,
  mockOutletFunctions,
} from "@/features/masters/mocks/data";

const testMasters = {
  brands: mockBrands,
  functions: mockOutletFunctions,
};

describe("buildOutletImportTemplateXlsx", () => {
  it("creates Lists, Outlets, and Instructions sheets", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.getWorksheet(OUTLET_LISTS_SHEET_NAME)).toBeTruthy();
    expect(workbook.getWorksheet(OUTLET_IMPORT_SHEET_NAME)).toBeTruthy();
    expect(workbook.getWorksheet("Instructions")).toBeTruthy();
    expect(workbook.worksheets[0]?.name).toBe(OUTLET_LISTS_SHEET_NAME);
  });

  it("hides Lists sheet and populates master names", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const lists = workbook.getWorksheet(OUTLET_LISTS_SHEET_NAME)!;
    expect(lists.state).toBe("hidden");
    expect(lists.getCell(1, 1).value).toBe("Honda");
    expect(lists.getCell(1, 2).value).toBe("Sales");
  });

  it("registers workbook defined names for brand and function lists", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const brandRanges = workbook.definedNames.getRanges(OUTLET_IMPORT_BRANDS_NAME);
    const functionRanges = workbook.definedNames.getRanges(
      OUTLET_IMPORT_FUNCTIONS_NAME,
    );

    expect(brandRanges.ranges.length).toBeGreaterThan(0);
    expect(brandRanges.ranges[0]).toContain(`${OUTLET_LISTS_SHEET_NAME}!`);
    expect(functionRanges.ranges.length).toBeGreaterThan(0);
    expect(functionRanges.ranges[0]).toContain(`${OUTLET_LISTS_SHEET_NAME}!`);
  });

  it("applies list validation across the brand and function columns", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const outlets = workbook.getWorksheet(OUTLET_IMPORT_SHEET_NAME)!;

    for (const row of [2, 5, 100, 500] as const) {
      const brandValidation = outlets.getCell(row, 2).dataValidation;
      const functionValidation = outlets.getCell(row, 3).dataValidation;

      expect(brandValidation?.type).toBe("list");
      expect(brandValidation?.formulae?.[0]).toContain(OUTLET_IMPORT_BRANDS_NAME);
      expect(functionValidation?.type).toBe("list");
      expect(functionValidation?.formulae?.[0]).toContain(
        OUTLET_IMPORT_FUNCTIONS_NAME,
      );
    }
  });

  it("uses a single function name in the Excel example row", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const outlets = workbook.getWorksheet(OUTLET_IMPORT_SHEET_NAME)!;
    expect(outlets.getCell(2, 2).value).toBe("Honda");
    expect(outlets.getCell(2, 3).value).toBe("Sales");
  });

  it("still builds when masters are empty", async () => {
    const buffer = await buildOutletImportTemplateXlsx({
      brands: [],
      functions: [],
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const outlets = workbook.getWorksheet(OUTLET_IMPORT_SHEET_NAME)!;
    expect(outlets.getRow(1).values).toBeTruthy();
    expect(outlets.getCell(2, 2).dataValidation).toBeFalsy();
    expect(outlets.getCell(2, 3).dataValidation).toBeFalsy();
  });
});

describe("parseOutletImportXlsxBuffer", () => {
  it("parses example row from generated template", async () => {
    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    const { items, errors } = await parseOutletImportXlsxBuffer(buffer);

    expect(errors).toEqual([]);
    expect(items[0]).toMatchObject({
      name: "Sanganer",
      brandName: "Honda",
      outletFunctions: ["Sales"],
    });
  });
});
