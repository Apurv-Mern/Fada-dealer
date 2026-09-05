import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildOutletImportResult,
  importOutletsFile,
  mapOutletToBranch,
} from "@/features/branches/api";
import { buildOutletImportTemplateCsv, OUTLET_CSV_HEADERS } from "@/features/branches/csv-template";
import { buildOutletImportTemplateXlsx } from "@/features/branches/excel-template";
import { apiFetch, isMockMode } from "@/lib/api";
import {
  mockBrands,
  mockOutletFunctions,
} from "@/features/masters/mocks/data";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    isMockMode: vi.fn(() => true),
    apiFetch: vi.fn(),
  };
});

vi.mock("@/features/masters/api", () => ({
  getBrands: vi.fn(async () => mockBrands),
  getOutletFunctions: vi.fn(async () => mockOutletFunctions),
}));

const testMasters = {
  brands: mockBrands,
  functions: mockOutletFunctions,
};

describe("mapOutletToBranch", () => {
  it("maps outletCode from API payload", () => {
    const branch = mapOutletToBranch({
      id: 12,
      name: "Sanganer",
      outletCode: "OT583721",
      isActive: true,
    });

    expect(branch.outletCode).toBe("OT583721");
  });

  it("falls back to publicCode when outletCode is absent", () => {
    const branch = mapOutletToBranch({
      id: 13,
      name: "Jaipur",
      publicCode: "OT583722",
      isActive: true,
    });

    expect(branch.outletCode).toBe("OT583722");
  });
});

describe("buildOutletImportResult", () => {
  const items = [
    {
      name: "Sanganer",
      brandName: "Honda",
      outletFunctions: ["Sales", "Service"],
    },
    {
      name: "Skip Outlet",
      brandName: "Honda",
      outletFunctions: ["Sales"],
    },
  ];

  it("derives counts from skipped rows", () => {
    const result = buildOutletImportResult(items, [
      {
        ...items[1]!,
        reason: "Outlet already exists",
      },
    ]);

    expect(result).toEqual({
      total: 2,
      created: 1,
      failed: 1,
      errors: [
        {
          row: 3,
          message: "Outlet already exists",
        },
      ],
    });
  });

  it("returns parse errors without calling API semantics", () => {
    const result = buildOutletImportResult(
      [],
      [],
      [{ row: 2, message: "Missing required field(s): brandName" }],
    );

    expect(result).toEqual({
      total: 1,
      created: 0,
      failed: 1,
      errors: [{ row: 2, message: "Missing required field(s): brandName" }],
    });
  });
});

describe("importOutletsFile", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  function importCsv(content: string) {
    const file = new File([content], "import.csv", { type: "text/csv" });
    return importOutletsFile(file);
  }

  async function importXlsx(buffer: ArrayBuffer) {
    const file = new File([buffer], "import.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    return importOutletsFile(file);
  }

  it("posts JSON array in live mode for CSV", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: [] });

    await importCsv(buildOutletImportTemplateCsv(testMasters));

    expect(apiFetch).toHaveBeenCalledWith("/dealers/outlets/import", {
      method: "POST",
      body: [
        expect.objectContaining({
          name: "Sanganer",
          brandName: "Honda",
          outletFunctions: ["Sales", "Workshop"],
        }),
      ],
    });
  });

  it("posts JSON array in live mode for XLSX", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: [] });

    const buffer = await buildOutletImportTemplateXlsx(testMasters);
    await importXlsx(buffer);

    expect(apiFetch).toHaveBeenCalledWith("/dealers/outlets/import", {
      method: "POST",
      body: [expect.objectContaining({ brandName: "Honda" })],
    });
  });

  it("maps live skipped rows into UI result", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: [
        {
          name: "Sanganer",
          brandName: "Honda",
          outletFunctions: ["Sales", "Workshop"],
          reason: "Outlet already exists",
        },
      ],
    });

    const result = await importCsv(buildOutletImportTemplateCsv(testMasters));

    expect(result).toEqual({
      total: 1,
      created: 0,
      failed: 1,
      errors: [{ row: 2, message: "Outlet already exists" }],
    });
  });

  it("skips rows in mock mode when name contains skip", async () => {
    const csv = `${buildOutletImportTemplateCsv(testMasters).split("\n").slice(0, 2).join("\n")}\nSkip Test,Honda,Sales,,,,,`;
    const result = await importCsv(csv);

    expect(result.total).toBe(2);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toBe("Outlet already exists");
  });

  it("returns parse errors without POST", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);

    const result = await importCsv("name,brandName\nOnly,Headers");

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.failed).toBeGreaterThan(0);
  });

  it("blocks import when brand is unknown", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);

    const csv = `${OUTLET_CSV_HEADERS.join(",")}\nBad Brand Outlet,NotARealBrand,Sales,,,,,`;
    const result = await importCsv(csv);

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toMatch(/Brand 'NotARealBrand' not found/);
  });
});
