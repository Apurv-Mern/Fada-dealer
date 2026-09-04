import { describe, expect, it } from "vitest";

import {
  PROFILE_EMPTY_MARKER,
  buildDealerProfileUpdate,
  companyCode,
  displayProfileField,
  missingRequiredProfileFields,
  type DealerProfile,
  type DealerProfileUpdateInput,
} from "@/features/dealership/types";

function baseProfile(overrides: Partial<DealerProfile> = {}): DealerProfile {
  return {
    id: "1",
    name: "Test Motors",
    email: "dealer@example.com",
    phone: "9876543210",
    dealerCode: "DLR-001",
    status: "pending",
    isActive: true,
    totalOutlets: 0,
    allEmployees: 0,
    typeOfDealership: "Authorised Dealer",
    yearOfEstablishment: "2010",
    panNumber: "ABCDE1234F",
    fadaMembershipId: "",
    fadaMemberSince: "",
    address: "MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    country: "India",
    gstNumber: "27AAKCS1234K1Z5",
    natureOfBusiness: "",
    brandsRepresented: "Honda, Toyota",
    brandIds: [1, 3],
    totalShowrooms: 0,
    totalWorkshops: 0,
    primaryContactName: "",
    primaryContactPhone: "",
    logoUrl: "",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<DealerProfileUpdateInput> = {},
): DealerProfileUpdateInput {
  return {
    name: "Test Motors",
    phone: "9876543210",
    typeOfDealership: "Authorised Dealer",
    yearOfEstablishment: "2010",
    panNumber: "ABCDE1234F",
    fadaMembershipId: "",
    fadaMemberSince: "",
    gstNumber: "27AAKCS1234K1Z5",
    natureOfBusiness: "",
    brandsRepresented: [1, 2],
    totalShowrooms: 0,
    totalWorkshops: 0,
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400001",
    ...overrides,
  };
}

describe("displayProfileField", () => {
  it("returns placeholder for blank values", () => {
    expect(displayProfileField("")).toBe(PROFILE_EMPTY_MARKER);
    expect(displayProfileField(null)).toBe(PROFILE_EMPTY_MARKER);
  });

  it("returns trimmed text when present", () => {
    expect(displayProfileField("  Jaipur  ")).toBe("Jaipur");
  });
});

describe("companyCode", () => {
  it("returns profile id as the company code", () => {
    expect(companyCode(baseProfile({ id: "40" }))).toBe("40");
  });

  it("trims whitespace and ignores dealerCode", () => {
    expect(
      companyCode(baseProfile({ id: "  40  ", dealerCode: "vn2806" })),
    ).toBe("40");
  });

  it("returns empty when id is blank", () => {
    expect(companyCode(baseProfile({ id: "" }))).toBe("");
  });
});

describe("missingRequiredProfileFields", () => {
  it("includes GST Number when gstNumber is blank", () => {
    expect(
      missingRequiredProfileFields(baseInput({ gstNumber: "" })),
    ).toContain("GST Number");
  });

  it("returns no missing fields when required values are present", () => {
    expect(missingRequiredProfileFields(baseInput())).toEqual([]);
  });
});

describe("buildDealerProfileUpdate", () => {
  it("falls back to profile brandIds when patch omits brandsRepresented", () => {
    const profile = baseProfile({ brandIds: [1, 3] });
    const payload = buildDealerProfileUpdate(profile, { name: "Updated Motors" });

    expect(payload.brandsRepresented).toEqual([1, 3]);
  });

  it("uses patch brand ids when provided", () => {
    const profile = baseProfile({ brandIds: [1, 3] });
    const payload = buildDealerProfileUpdate(profile, {
      brandsRepresented: [2, 4],
    });

    expect(payload.brandsRepresented).toEqual([2, 4]);
  });
});
