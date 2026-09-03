import { describe, expect, it } from "vitest";

import {
  EMPLOYEE_CSV_HEADERS,
  buildEmployeeImportTemplateCsv,
  parseCsvLine,
  parseEmployeeImportCsv,
  validateEmployeeImportCsv,
} from "@/features/employees/csv-template";

function csvFile(content: string, name = "import.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("buildEmployeeImportTemplateCsv", () => {
  it("matches Swagger column order and example", () => {
    const csv = buildEmployeeImportTemplateCsv();
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe(EMPLOYEE_CSV_HEADERS.join(","));
    expect(lines[1]).toBe(
      "John Doe,john@example.com,9876543210,Sales Executive,Sales,OT583721,2026-01-15",
    );
  });
});

describe("parseCsvLine", () => {
  it("handles quoted commas", () => {
    expect(parseCsvLine('"Sales, Lead",Sales')).toEqual(["Sales, Lead", "Sales"]);
  });
});

describe("validateEmployeeImportCsv", () => {
  it("requires all Swagger headers", async () => {
    const file = csvFile("name,email\nJane,jane@example.com");
    await expect(validateEmployeeImportCsv(file)).resolves.toMatch(
      /header must include/i,
    );
  });

  it("accepts a valid header row", async () => {
    const file = csvFile(buildEmployeeImportTemplateCsv());
    await expect(validateEmployeeImportCsv(file)).resolves.toBeNull();
  });
});

describe("parseEmployeeImportCsv", () => {
  it("parses a valid template row", async () => {
    const file = csvFile(buildEmployeeImportTemplateCsv());
    const { items, errors } = await parseEmployeeImportCsv(file);

    expect(errors).toEqual([]);
    expect(items).toEqual([
      {
        name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        designation: "Sales Executive",
        department: "Sales",
        outletCode: "OT583721",
        startDate: "2026-01-15",
      },
    ]);
  });

  it("reports invalid outletCode", async () => {
    const file = csvFile(
      `${EMPLOYEE_CSV_HEADERS.join(",")}\nJane,jane@example.com,9876543210,Exec,Sales,BAD123,2026-01-15`,
    );
    const { items, errors } = await parseEmployeeImportCsv(file);

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/outletCode/);
  });

  it("reports invalid startDate", async () => {
    const file = csvFile(
      `${EMPLOYEE_CSV_HEADERS.join(",")}\nJane,jane@example.com,9876543210,Exec,Sales,OT583721,15-01-2026`,
    );
    const { errors } = await parseEmployeeImportCsv(file);

    expect(errors[0]?.message).toMatch(/startDate/);
  });

  it("rejects header-only files", async () => {
    const file = csvFile(EMPLOYEE_CSV_HEADERS.join(","));
    const { items, errors } = await parseEmployeeImportCsv(file);

    expect(items).toEqual([]);
    expect(errors[0]?.message).toMatch(/no data rows/i);
  });
});
