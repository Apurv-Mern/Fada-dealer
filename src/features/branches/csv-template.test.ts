import { describe, expect, it } from "vitest";

import {
  OUTLET_CSV_HEADERS,
  buildOutletImportTemplateCsv,
  parseCsvLine,
  parseOutletImportCsv,
  validateOutletImportCsv,
} from "@/features/branches/csv-template";

function csvFile(content: string, name = "import.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("buildOutletImportTemplateCsv", () => {
  it("matches Swagger column order and example", () => {
    const csv = buildOutletImportTemplateCsv();
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(OUTLET_CSV_HEADERS.join(","));
    expect(lines[1]).toBe(
      'Sanganer,Maruti,Sales|Service,Shambhu,303908,Jaipur,Rajasthan,"jaipur, kotkhawada"',
    );
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
  it("requires all Swagger headers", async () => {
    const file = csvFile("name,brandName\nSanganer,Maruti");
    await expect(validateOutletImportCsv(file)).resolves.toMatch(
      /header must include/i,
    );
  });

  it("accepts a valid header row", async () => {
    const file = csvFile(buildOutletImportTemplateCsv());
    await expect(validateOutletImportCsv(file)).resolves.toBeNull();
  });
});

describe("parseOutletImportCsv", () => {
  it("parses a valid template row", async () => {
    const file = csvFile(buildOutletImportTemplateCsv());
    const { items, errors } = await parseOutletImportCsv(file);

    expect(errors).toEqual([]);
    expect(items).toEqual([
      {
        name: "Sanganer",
        brandName: "Maruti",
        outletFunctions: ["Sales", "Service"],
        manager: "Shambhu",
        pincode: "303908",
        city: "Jaipur",
        state: "Rajasthan",
        address: "jaipur, kotkhawada",
      },
    ]);
  });

  it("reports missing outletFunctions", async () => {
    const file = csvFile(
      `${OUTLET_CSV_HEADERS.join(",")}\nSanganer,Maruti,,Shambhu,303908,Jaipur,Rajasthan,addr`,
    );
    const { items, errors } = await parseOutletImportCsv(file);

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/outletFunctions/);
  });

  it("reports invalid pincode", async () => {
    const file = csvFile(
      `${OUTLET_CSV_HEADERS.join(",")}\nSanganer,Maruti,Sales,Shambhu,123,Jaipur,Rajasthan,addr`,
    );
    const { errors } = await parseOutletImportCsv(file);

    expect(errors[0]?.message).toMatch(/pincode/);
  });

  it("rejects header-only files", async () => {
    const file = csvFile(OUTLET_CSV_HEADERS.join(","));
    const { items, errors } = await parseOutletImportCsv(file);

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/no data rows/i);
  });
});
