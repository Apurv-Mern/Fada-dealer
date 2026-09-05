import { describe, expect, it, vi } from "vitest";

import {
  buildMasterNameLookup,
  buildOutletImportExampleValues,
  buildOutletImportExcelExampleValues,
  fetchOutletImportMasters,
  mastersHaveDropdownData,
  resolveMasterName,
} from "@/features/branches/import-masters";
import {
  mockBrands,
  mockOutletFunctions,
} from "@/features/masters/mocks/data";

vi.mock("@/features/masters/api", () => ({
  getBrands: vi.fn(async () => mockBrands),
  getOutletFunctions: vi.fn(async () => mockOutletFunctions),
}));

describe("fetchOutletImportMasters", () => {
  it("returns brands and functions in parallel", async () => {
    const masters = await fetchOutletImportMasters();
    expect(masters.brands).toEqual(mockBrands);
    expect(masters.functions).toEqual(mockOutletFunctions);
  });
});

describe("buildOutletImportExampleValues", () => {
  it("uses first brand and first two functions from masters", () => {
    const values = buildOutletImportExampleValues({
      brands: mockBrands,
      functions: mockOutletFunctions,
    });
    expect(values.brandName).toBe("Honda");
    expect(values.outletFunctions).toBe("Sales|Workshop");
  });

  it("handles empty masters", () => {
    expect(
      buildOutletImportExampleValues({ brands: [], functions: [] }),
    ).toEqual({
      brandName: "",
      outletFunctions: "",
    });
  });
});

describe("buildOutletImportExcelExampleValues", () => {
  it("uses first brand and a single function for Excel dropdowns", () => {
    const values = buildOutletImportExcelExampleValues({
      brands: mockBrands,
      functions: mockOutletFunctions,
    });
    expect(values.brandName).toBe("Honda");
    expect(values.outletFunctions).toBe("Sales");
  });
});

describe("buildMasterNameLookup", () => {
  it("resolves case-insensitively", () => {
    const lookup = buildMasterNameLookup(mockBrands);
    expect(resolveMasterName("honda", lookup)).toBe("Honda");
    expect(resolveMasterName("Unknown", lookup)).toBeNull();
  });
});

describe("mastersHaveDropdownData", () => {
  it("is false when both lists are empty", () => {
    expect(mastersHaveDropdownData({ brands: [], functions: [] })).toBe(false);
  });

  it("is true when either list has items", () => {
    expect(
      mastersHaveDropdownData({ brands: mockBrands, functions: [] }),
    ).toBe(true);
  });
});
