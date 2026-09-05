import { describe, expect, it } from "vitest";

import {
  brandNamesFromCatalog,
  enrichProfileBrandNames,
} from "@/features/dealership/brand-display";
import type { DealerProfile } from "@/features/dealership/types";

const catalog = [
  { id: "1", name: "Honda" },
  { id: "3", name: "Toyota" },
  { id: "5", name: "Tata Motors" },
];

function baseProfile(overrides: Partial<DealerProfile> = {}): DealerProfile {
  return {
    id: "1",
    name: "Test Motors",
    email: "dealer@example.com",
    phone: "9876543210",
    dealerCode: "DLR-001",
    dealerId: "DL38758",
    status: "approved",
    isActive: true,
    totalOutlets: 0,
    allEmployees: 0,
    typeOfDealership: "",
    yearOfEstablishment: "",
    panNumber: "",
    fadaMembershipId: "",
    fadaMemberSince: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    gstNumber: "",
    natureOfBusiness: "",
    brandsRepresented: "",
    brandIds: [],
    totalShowrooms: 0,
    totalWorkshops: 0,
    primaryContactName: "",
    primaryContactPhone: "",
    logoUrl: "",
    ...overrides,
  };
}

describe("brandNamesFromCatalog", () => {
  it("maps ids to catalog names preserving order", () => {
    expect(brandNamesFromCatalog([1, 3, 5], catalog)).toEqual([
      "Honda",
      "Toyota",
      "Tata Motors",
    ]);
  });

  it("falls back for unknown ids", () => {
    expect(brandNamesFromCatalog([99], catalog)).toEqual(["Brand #99"]);
  });
});

describe("enrichProfileBrandNames", () => {
  it("joins resolved names when only brandIds are present", () => {
    const profile = enrichProfileBrandNames(
      baseProfile({ brandIds: [1, 3, 5] }),
      catalog,
    );

    expect(profile.brandsRepresented).toBe("Honda, Toyota, Tata Motors");
  });

  it("keeps legacy string brandsRepresented from GET", () => {
    const profile = enrichProfileBrandNames(
      baseProfile({
        brandIds: [1, 3],
        brandsRepresented: "BMW, Audi",
      }),
      catalog,
    );

    expect(profile.brandsRepresented).toBe("BMW, Audi");
  });

  it("returns profile unchanged when no brand ids", () => {
    const profile = baseProfile();
    expect(enrichProfileBrandNames(profile, catalog)).toEqual(profile);
  });
});
