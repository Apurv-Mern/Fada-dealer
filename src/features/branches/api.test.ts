import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildOutletImportResult,
  importOutletsCsv,
} from "@/features/branches/api";
import { buildOutletImportTemplateCsv } from "@/features/branches/csv-template";
import { apiFetch, isMockMode } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    isMockMode: vi.fn(() => true),
    apiFetch: vi.fn(),
  };
});

describe("buildOutletImportResult", () => {
  const items = [
    {
      name: "Sanganer",
      brandName: "Maruti",
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

describe("importOutletsCsv", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  function importFile(content: string): Promise<import("@/features/branches/types").OutletImportResult> {
    const file = new File([content], "import.csv", { type: "text/csv" });
    return importOutletsCsv(file);
  }

  it("posts JSON array in live mode", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: [] });

    await importFile(buildOutletImportTemplateCsv());

    expect(apiFetch).toHaveBeenCalledWith("/dealers/outlets/import", {
      method: "POST",
      body: [
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
      ],
    });
  });

  it("maps live skipped rows into UI result", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: [
        {
          name: "Sanganer",
          brandName: "Maruti",
          outletFunctions: ["Sales", "Service"],
          reason: "Outlet already exists",
        },
      ],
    });

    const result = await importFile(buildOutletImportTemplateCsv());

    expect(result).toEqual({
      total: 1,
      created: 0,
      failed: 1,
      errors: [{ row: 2, message: "Outlet already exists" }],
    });
  });

  it("skips rows in mock mode when name contains skip", async () => {
    const csv = `${buildOutletImportTemplateCsv().trim()}\nSkip Test,Maruti,Sales,,,,,`;
    const result = await importFile(csv);

    expect(result.total).toBe(2);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toBe("Outlet already exists");
  });

  it("returns parse errors without POST", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);

    const result = await importFile("name,brandName\nOnly,Headers");

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.failed).toBeGreaterThan(0);
  });
});
