import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteBusinessDocument,
  mapBusinessDocument,
  mapDealerProfile,
  toDealerProfileUpdateBody,
  updateDealerProfile,
  uploadBusinessDocument,
  uploadDealerProfilePicture,
} from "@/features/dealership/api";
import {
  clearTokens,
  getProfile,
  setSession,
} from "@/features/auth/token-store";
import { apiFetch, apiUploadFile, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    isMockMode: vi.fn(() => true),
    apiFetch: vi.fn(),
    apiUploadFile: vi.fn(),
  };
});

describe("mapBusinessDocument", () => {
  it("maps live-shaped checklist rows with upload metadata", () => {
    const doc = mapBusinessDocument({
      id: 3,
      name: "GST Certificate",
      category: "Compliance",
      notes: "Upload clear PDF",
      isMandatory: true,
      isVerificationRequired: true,
      isUploaded: true,
      upload: {
        id: 42,
        documentUrl: "https://api.fadaid.com/uploads/gst.pdf",
        status: "pending",
        isVerified: false,
        uploadedAt: "2026-08-17T06:30:00.000Z",
      },
    });

    expect(doc.id).toBe("3");
    expect(doc.name).toBe("GST Certificate");
    expect(doc.isUploaded).toBe(true);
    expect(doc.upload).toEqual({
      id: "42",
      documentUrl: "https://api.fadaid.com/uploads/gst.pdf",
      status: "pending",
      isVerified: false,
      uploadedAt: "2026-08-17T06:30:00.000Z",
    });
  });

  it("derives isUploaded from upload when flag is absent", () => {
    const doc = mapBusinessDocument({
      id: 5,
      name: "PAN Card",
      upload: {
        id: 9,
        documentUrl: "https://api.fadaid.com/uploads/pan.pdf",
        status: "approved",
        isVerified: true,
        uploadedAt: "2026-08-01T00:00:00.000Z",
      },
    });

    expect(doc.isUploaded).toBe(true);
    expect(doc.upload?.status).toBe("approved");
    expect(doc.upload?.isVerified).toBe(true);
  });
});

describe("uploadBusinessDocument", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiUploadFile).mockReset();
  });

  it("posts the live upload contract after file upload", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiUploadFile).mockResolvedValue(
      "https://api.fadaid.com/uploads/new-doc.pdf",
    );
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    const file = new File(["pdf"], "gst.pdf", { type: "application/pdf" });
    await uploadBusinessDocument("7", file);

    expect(apiUploadFile).toHaveBeenCalledWith(file);
    expect(apiFetch).toHaveBeenCalledWith("/dealers/business-documents", {
      method: "POST",
      body: {
        documentId: 7,
        documentUrl: "https://api.fadaid.com/uploads/new-doc.pdf",
      },
    });
  });

  it("deletes existing upload before posting a replacement", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiUploadFile).mockResolvedValue(
      "https://api.fadaid.com/uploads/replaced.pdf",
    );
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    const file = new File(["pdf"], "pan.pdf", { type: "application/pdf" });
    await uploadBusinessDocument("4", file, { replaceUploadId: "18" });

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/dealers/business-documents/18",
      { method: "DELETE" },
    );
    expect(apiUploadFile).toHaveBeenCalledWith(file);
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/dealers/business-documents", {
      method: "POST",
      body: {
        documentId: 4,
        documentUrl: "https://api.fadaid.com/uploads/replaced.pdf",
      },
    });
  });

  it("rejects invalid document type ids", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);

    const file = new File(["pdf"], "gst.pdf", { type: "application/pdf" });
    await expect(uploadBusinessDocument("not-a-number", file)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(apiUploadFile).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe("deleteBusinessDocument", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  it("calls delete endpoint with upload record id", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await deleteBusinessDocument("22");

    expect(apiFetch).toHaveBeenCalledWith("/dealers/business-documents/22", {
      method: "DELETE",
    });
  });
});

describe("mapDealerProfile", () => {
  it("maps top-level id as company id when dealerCode is absent", () => {
    const profile = mapDealerProfile({
      id: 40,
      name: "Alex motor showrrom",
      email: "alx28@mailinator.com",
    });

    expect(profile.id).toBe("40");
    expect(profile.dealerCode).toBe("");
  });

  it("maps live GET brands string onto brandsRepresented", () => {
    const profile = mapDealerProfile({
      id: 33,
      name: "Vinay motor pvt ltd",
      email: "vn28@mailinator.com",
      phone: "9658742100",
      dealerCode: "vn2806",
      brands: "BMW, Tata",
      status: "pending",
      isActive: true,
      totalOutlets: 0,
      allEmployees: 0,
      profile: {
        id: 4,
        dealerId: 33,
        typeOfDealership: null,
        yearOfEstablishment: null,
        panNumber: "iicps6954j",
        fadaMembershipId: null,
        fadaMemberSince: null,
      },
      location: null,
    });

    expect(profile.brandsRepresented).toBe("BMW, Tata");
    expect(profile.brandIds).toEqual([]);
    expect(profile.panNumber).toBe("iicps6954j");
  });

  it("joins brand name arrays and objects", () => {
    expect(
      mapDealerProfile({ brands: ["Honda", "Toyota"] }).brandsRepresented,
    ).toBe("Honda, Toyota");
    expect(
      mapDealerProfile({
        brands: [{ id: 1, name: "BMW" }, { slug: "tata" }],
      }).brandsRepresented,
    ).toBe("BMW, tata");
    expect(
      mapDealerProfile({
        brands: [{ id: 1, name: "BMW" }, { slug: "tata" }],
      }).brandIds,
    ).toEqual([1]);
  });

  it("maps numeric brand arrays onto brandIds without display ids", () => {
    const profile = mapDealerProfile({ brands: [1, 2, 3] });

    expect(profile.brandIds).toEqual([1, 2, 3]);
    expect(profile.brandsRepresented).toBe("");
  });

  it("maps brandsRepresented numeric array onto brandIds", () => {
    const profile = mapDealerProfile({ brandsRepresented: [4, 5] });

    expect(profile.brandIds).toEqual([4, 5]);
    expect(profile.brandsRepresented).toBe("");
  });

  it("returns empty values when brands are missing or null", () => {
    expect(mapDealerProfile({}).brandsRepresented).toBe("");
    expect(mapDealerProfile({}).brandIds).toEqual([]);
    expect(mapDealerProfile({ brands: null }).brandsRepresented).toBe("");
    expect(mapDealerProfile({ brands: null }).brandIds).toEqual([]);
  });

  it("maps profilePicture onto logoUrl", () => {
    expect(
      mapDealerProfile({
        profilePicture: "https://api.fadaid.com/uploads/pic.png",
      }).logoUrl,
    ).toBe("https://api.fadaid.com/uploads/pic.png");
    expect(
      mapDealerProfile({
        profile: {
          profilePicture: "https://api.fadaid.com/uploads/nested.png",
        },
      }).logoUrl,
    ).toBe("https://api.fadaid.com/uploads/nested.png");
  });

  it("prefers top-level profilePicture over logoUrl fallbacks", () => {
    expect(
      mapDealerProfile({
        profilePicture: "https://api.fadaid.com/uploads/primary.png",
        logoUrl: "https://api.fadaid.com/uploads/secondary.png",
      }).logoUrl,
    ).toBe("https://api.fadaid.com/uploads/primary.png");
  });

  it("maps live GET profile payload profilePicture", () => {
    const profile = mapDealerProfile({
      id: 16,
      name: "Abhishek dev",
      email: "devmail@gmail.com",
      phone: "98765432145",
      dealerCode: "98769875",
      brands: "Audi, MG",
      status: "approved",
      isActive: true,
      profilePicture:
        "https://api.fadaid.com/uploads/1787304300283-872733348.png",
      totalOutlets: 5,
      allEmployees: 12,
      profile: {
        id: 3,
        dealerId: 16,
        typeOfDealership: "dev mail",
        yearOfEstablishment: "2026",
        panNumber: "iicps9654j",
        fadaMembershipId: "asa",
        fadaMemberSince: "2026-08-04",
      },
      location: {
        id: 2,
        dealerId: 16,
        pinCode: "303908",
        city: "jaipur",
        state: "Rajasthan",
        country: "India",
        gstNumber: "08AAOCS1246P1Z9",
        address: "Update new address",
      },
    });

    expect(profile.logoUrl).toBe(
      "https://api.fadaid.com/uploads/1787304300283-872733348.png",
    );
    expect(profile.name).toBe("Abhishek dev");
    expect(profile.city).toBe("jaipur");
  });

  it("treats nullish profilePicture values as empty", () => {
    expect(mapDealerProfile({ profilePicture: null }).logoUrl).toBe("");
    expect(mapDealerProfile({ profilePicture: "" }).logoUrl).toBe("");
    expect(mapDealerProfile({ profilePicture: "null" }).logoUrl).toBe("");
    expect(mapDealerProfile({ profilePicture: "undefined" }).logoUrl).toBe("");
    expect(mapDealerProfile({}).logoUrl).toBe("");
  });

  it("maps fileUrl onto logoUrl", () => {
    expect(
      mapDealerProfile({
        fileUrl: "https://api.fadaid.com/uploads/from-file-url.png",
      }).logoUrl,
    ).toBe("https://api.fadaid.com/uploads/from-file-url.png");
  });
});

describe("uploadDealerProfilePicture", () => {
  beforeEach(() => {
    clearTokens();
    setSession({
      accessToken: "token",
      profile: {
        id: "16",
        email: "test@example.com",
        name: "Test Motors",
        roleLabel: "Dealer Admin",
        userType: "dealer",
        permissions: [],
        isSuperRole: true,
      },
    });
  });

  afterEach(() => {
    clearTokens();
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
    vi.mocked(apiUploadFile).mockReset();
  });

  it("uploads the file then persists the URL on the profile-picture endpoint", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiUploadFile).mockResolvedValue(
      "https://api.fadaid.com/uploads/new-logo.png",
    );
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: { fileUrl: "https://api.fadaid.com/uploads/new-logo.png" },
    });

    const file = new File(["img"], "logo.png", { type: "image/png" });
    const url = await uploadDealerProfilePicture(file);

    expect(apiUploadFile).toHaveBeenCalledWith(file);
    expect(apiFetch).toHaveBeenCalledWith("/dealers/user/upload-profile-picture", {
      method: "PUT",
      body: { fileUrl: "https://api.fadaid.com/uploads/new-logo.png" },
    });
    expect(url).toBe("https://api.fadaid.com/uploads/new-logo.png");
    expect(getProfile()?.logoUrl).toBe(
      "https://api.fadaid.com/uploads/new-logo.png",
    );
  });

  it("falls back to the uploaded URL when persist response omits it", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiUploadFile).mockResolvedValue(
      "https://api.fadaid.com/uploads/fallback.png",
    );
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    const file = new File(["img"], "logo.png", { type: "image/png" });
    await expect(uploadDealerProfilePicture(file)).resolves.toBe(
      "https://api.fadaid.com/uploads/fallback.png",
    );
  });

  it("does not call persist when file upload fails", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiUploadFile).mockRejectedValue(
      new ApiError({ message: "Upload failed", status: 500 }),
    );

    const file = new File(["img"], "logo.png", { type: "image/png" });
    await expect(uploadDealerProfilePicture(file)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe("toDealerProfileUpdateBody", () => {
  it("serializes brandsRepresented as numeric brand id array", () => {
    expect(
      toDealerProfileUpdateBody({
        name: "Test Motors",
        phone: "9876543210",
        yearOfEstablishment: "2010",
        panNumber: "ABCDE1234F",
        fadaMembershipId: "",
        fadaMemberSince: "",
        brandsRepresented: [1, 2, 3],
      }).brandsRepresented,
    ).toEqual([1, 2, 3]);
  });

  it("filters invalid brand ids", () => {
    expect(
      toDealerProfileUpdateBody({
        name: "Test Motors",
        phone: "9876543210",
        yearOfEstablishment: "2010",
        panNumber: "ABCDE1234F",
        fadaMembershipId: "",
        fadaMemberSince: "",
        brandsRepresented: [1, 0, -2, 3.5, 4],
      }).brandsRepresented,
    ).toEqual([1, 4]);
  });
});

describe("updateDealerProfile", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  it("sends brandsRepresented as number[] on live PUT", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: { id: 1, name: "Test Motors", brands: [1, 2] },
    });

    await updateDealerProfile({
      name: "Test Motors",
      phone: "9876543210",
      yearOfEstablishment: "2010",
      panNumber: "ABCDE1234F",
      fadaMembershipId: "",
      fadaMemberSince: "",
      brandsRepresented: [1, 2],
    });

    expect(apiFetch).toHaveBeenCalledWith("/dealers/user/profile", {
      method: "PUT",
      body: expect.objectContaining({
        brandsRepresented: [1, 2],
      }),
    });
  });
});
