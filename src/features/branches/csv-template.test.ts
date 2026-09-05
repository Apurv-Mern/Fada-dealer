import { describe, expect, it } from "vitest";

import {
  OUTLET_CSV_HEADERS,
  OUTLET_IMPORT_WRONG_FILE_MESSAGE,
  buildOutletImportTemplateCsv,
  parseCsvLine,
  parseOutletImportCsvText,
  validateOutletImportCsv,
} from "@/features/branches/csv-template";
import {
  mockBrands,
  mockOutletFunctions,
} from "@/features/masters/mocks/data";

const testMasters = {
  brands: mockBrands,
  functions: mockOutletFunctions,
};

function csvFile(content: string, name = "import.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("buildOutletImportTemplateCsv", () => {
  it("uses live master names in the example row", () => {
    const csv = buildOutletImportTemplateCsv(testMasters);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(OUTLET_CSV_HEADERS.join(","));
    expect(lines[1]).toContain("Honda");
    expect(lines[1]).toContain("Sales|Workshop");
  });

  it("appends comment reference lines", () => {
    const csv = buildOutletImportTemplateCsv(testMasters);
    expect(csv).toContain("# VALID BRANDS");
    expect(csv).toContain("# Honda");
    expect(csv).toContain("# VALID OUTLET FUNCTIONS");
    expect(csv).toContain("# Sales");
  });
});

describe("parseCsvLine", () => {
  it("handles quoted commas", () => {
    expect(parseCsvLine('"Sales|Service",Maruti')).toEqual([
      "Sales|Service",
      "Maruti",
    ]);
  });
});

describe("validateOutletImportCsv", () => {
  it("detects reference file headers", async () => {
    const file = csvFile("type,name\nbrand,Honda", "reference.csv");
    await expect(validateOutletImportCsv(file)).resolves.toBe(
      OUTLET_IMPORT_WRONG_FILE_MESSAGE,
    );
  });

  it("accepts a valid header row", async () => {
    const file = csvFile(buildOutletImportTemplateCsv(testMasters));
    await expect(validateOutletImportCsv(file)).resolves.toBeNull();
  });
});

describe("parseOutletImportCsvText", () => {
  it("parses a valid template row and skips comment lines", async () => {
    const csv = buildOutletImportTemplateCsv(testMasters);
    const { items, errors } = parseOutletImportCsvText(csv);

    expect(errors).toEqual([]);
    expect(items).toEqual([
      {
        name: "Sanganer",
        brandName: "Honda",
        outletFunctions: ["Sales", "Workshop"],
        manager: "Shambhu",
        pincode: "303908",
        city: "Jaipur",
        state: "Rajasthan",
        address: "jaipur, kotkhawada",
      },
    ]);
  });

  it("reports missing outletFunctions", () => {
    const { items, errors } = parseOutletImportCsvText(
      `${OUTLET_CSV_HEADERS.join(",")}\nSanganer,Maruti,,Shambhu,303908,Jaipur,Rajasthan,addr`,
    );

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/outletFunctions/);
  });

  it("reports invalid pincode", () => {
    const { errors } = parseOutletImportCsvText(
      `${OUTLET_CSV_HEADERS.join(",")}\nSanganer,Honda,Sales,Shambhu,123,Jaipur,Rajasthan,addr`,
    );

    expect(errors[0]?.message).toMatch(/pincode/);
  });

  it("rejects header-only files", () => {
    const { items, errors } = parseOutletImportCsvText(
      OUTLET_CSV_HEADERS.join(","),
    );

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/no data rows/i);
  });
});
