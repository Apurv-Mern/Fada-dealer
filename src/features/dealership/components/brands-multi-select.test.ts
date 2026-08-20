import { describe, expect, it } from "vitest";

import {
  parseBrandNames,
  seedSelectedBrands,
} from "@/features/dealership/components/brands-multi-select";

const catalog = [
  { id: "1", name: "Honda" },
  { id: "2", name: "Maruti Suzuki" },
  { id: "3", name: "Toyota" },
];

describe("parseBrandNames", () => {
  it("splits and trims comma-separated names", () => {
    expect(parseBrandNames(" Honda , Toyota ")).toEqual(["Honda", "Toyota"]);
  });
});

describe("seedSelectedBrands", () => {
  it("matches catalog brands by id when brandIds are provided", () => {
    expect(seedSelectedBrands("", catalog, [2, 3])).toEqual([
      { id: "2", name: "Maruti Suzuki" },
      { id: "3", name: "Toyota" },
    ]);
  });

  it("falls back to placeholder names for unknown brand ids", () => {
    expect(seedSelectedBrands("", catalog, [99])).toEqual([
      { id: "99", name: "Brand #99" },
    ]);
  });

  it("matches catalog brands case-insensitively", () => {
    expect(seedSelectedBrands("honda, TOYOTA", catalog)).toEqual([
      { id: "1", name: "Honda" },
      { id: "3", name: "Toyota" },
    ]);
  });

  it("keeps unmatched legacy names as synthetic chips", () => {
    expect(seedSelectedBrands("Honda, Legacy Motors", catalog)).toEqual([
      { id: "1", name: "Honda" },
      { id: "legacy:legacy motors", name: "Legacy Motors" },
    ]);
  });
});
