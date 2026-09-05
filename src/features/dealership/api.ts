import { getProfile, setProfile } from "@/features/auth/token-store";
import { apiFetch, apiUploadFile, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import { extractLogoUrl } from "@/lib/logo-url";
import { mockDelay, unwrapApiData } from "@/lib/api/parse";
import {
  emptyActivity,
  mockContacts,
  mockDealerProfile,
  mockDocuments,
} from "@/features/dealership/mocks/data";
import { enrichProfileBrandNames } from "@/features/dealership/brand-display";
import { mockBrands } from "@/features/masters/mocks/data";
import { getBrands } from "@/features/masters/api";
import type {
  BusinessDocument,
  DealerProfile,
  DealerProfileUpdateInput,
  DealershipPageData,
  KeyContact,
  KeyContactInput,
} from "@/features/dealership/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return 0;
}

function readBool(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return value === true || value === "true" || value === 1;
}

function readLocation(record: Record<string, unknown>): Record<string, unknown> {
  const raw =
    record.dealerLocations ?? record.registeredAddress ?? record.location;
  if (Array.isArray(raw)) return asRecord(raw[0]);
  return asRecord(raw);
}

function readYear(value: unknown): string {
  if (value == null || value === "") return "";
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return "";
  return text;
}

function toDateInput(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text === "undefined" || text === "null") return "";
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match?.[1]) return match[1];
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBrandId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

function isNumericOnlyBrandArray(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every((item) => parseBrandId(item) != null);
}

function formatBrandsValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (!Array.isArray(value)) return "";
  if (isNumericOnlyBrandArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item).trim();
      const row = asRecord(item);
      return readString(row, "name") || readString(row, "slug");
    })
    .filter(Boolean)
    .join(", ");
}

function parseBrandIdsFromValue(value: unknown): number[] {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return [value];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (/^\d+$/.test(trimmed)) return [Number(trimmed)];
    return [];
  }
  if (!Array.isArray(value)) return [];

  const ids: number[] = [];
  const seen = new Set<number>();
  for (const item of value) {
    if (typeof item === "string" || typeof item === "number") {
      const id = parseBrandId(item);
      if (id != null && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      continue;
    }
    const row = asRecord(item);
    const id =
      parseBrandId(row.id) ??
      parseBrandId(row.brandId) ??
      parseBrandId(row.value);
    if (id != null && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

function readBrandIds(
  profile: Record<string, unknown>,
  record: Record<string, unknown>,
): number[] {
  const sources = [
    record.brandsRepresented,
    profile.brandsRepresented,
    record.brands,
    record.brand,
    profile.brands,
    profile.brand,
  ];

  for (const source of sources) {
    const ids = parseBrandIdsFromValue(source);
    if (ids.length > 0) return ids;
  }
  return [];
}

function readBrandsRepresented(
  profile: Record<string, unknown>,
  record: Record<string, unknown>,
  brandIds: number[],
): string {
  const direct =
    readString(profile, "brandsRepresented") ||
    readString(record, "brandsRepresented");
  if (direct && brandIds.length === 0) return direct;
  return (
    formatBrandsValue(record.brands) ||
    formatBrandsValue(record.brand) ||
    formatBrandsValue(profile.brands) ||
    formatBrandsValue(profile.brand)
  );
}

export function toDealerProfileUpdateBody(
  input: DealerProfileUpdateInput,
): DealerProfileUpdateInput {
  const brandIds = (input.brandsRepresented ?? [])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return {
    ...input,
    brandsRepresented: brandIds,
  };
}

export function mapDealerProfile(raw: unknown): DealerProfile {
  const record = asRecord(raw);
  const profile = asRecord(record.profile);
  const location = readLocation(record);
  const primaryContact = asRecord(record.primaryContact);
  const brandIds = readBrandIds(profile, record);

  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name"),
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    dealerCode: readString(record, "dealerCode"),
    dealerId: readString(record, "dealerId"),
    status: readString(record, "status") || "pending",
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
    totalOutlets: readNumber(record, "totalOutlets"),
    allEmployees:
      readNumber(record, "allEmployees") ||
      readNumber(record, "totalActiveEmployees"),
    typeOfDealership:
      readString(profile, "typeOfDealership") ||
      readString(record, "typeOfDealership"),
    yearOfEstablishment: readYear(
      profile.yearOfEstablishment ?? record.yearOfEstablishment,
    ),
    panNumber: readString(profile, "panNumber") || readString(record, "panNumber"),
    fadaMembershipId:
      readString(profile, "fadaMembershipId") ||
      readString(record, "fadaMembershipId"),
    fadaMemberSince: toDateInput(
      profile.fadaMemberSince ?? record.fadaMemberSince,
    ),
    address:
      readString(location, "address") ||
      readString(profile, "address") ||
      readString(record, "address"),
    city:
      readString(location, "city") ||
      readString(profile, "city") ||
      readString(record, "city"),
    state:
      readString(location, "state") ||
      readString(profile, "state") ||
      readString(record, "state"),
    pinCode:
      readString(location, "pinCode") ||
      readString(profile, "pinCode") ||
      readString(record, "pinCode"),
    country: readString(location, "country") || "India",
    gstNumber:
      readString(location, "gstNumber") ||
      readString(profile, "gstNumber") ||
      readString(record, "gstNumber"),
    natureOfBusiness:
      readString(profile, "natureOfBusiness") ||
      readString(record, "natureOfBusiness"),
    brandsRepresented: readBrandsRepresented(profile, record, brandIds),
    brandIds,
    totalShowrooms:
      readNumber(profile, "totalShowrooms") ||
      readNumber(record, "totalShowrooms"),
    totalWorkshops:
      readNumber(profile, "totalWorkshops") ||
      readNumber(record, "totalWorkshops"),
    primaryContactName:
      readString(primaryContact, "name") ||
      readString(record, "primaryContactName") ||
      readString(profile, "primaryContactName"),
    primaryContactPhone:
      readString(primaryContact, "phone") ||
      readString(record, "primaryContactPhone") ||
      readString(profile, "primaryContactPhone"),
    logoUrl: extractLogoUrl(record, profile),
  };
}

export function mapKeyContact(raw: unknown): KeyContact {
  const record = asRecord(raw);
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name"),
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    designation: readString(record, "designation"),
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
  };
}

function pickUploadRaw(record: Record<string, unknown>): unknown {
  if (record.upload && typeof record.upload === "object" && !Array.isArray(record.upload)) {
    return record.upload;
  }
  if (Array.isArray(record.upload) && record.upload.length) return record.upload[0];
  if (Array.isArray(record.uploads) && record.uploads.length) return record.uploads[0];
  if (record.latestUpload && typeof record.latestUpload === "object") {
    return record.latestUpload;
  }
  if (record.documentUpload && typeof record.documentUpload === "object") {
    return record.documentUpload;
  }
  return null;
}

function mapUpload(raw: unknown): BusinessDocument["upload"] {
  if (!raw || typeof raw !== "object") return null;
  const u = asRecord(raw);
  const documentUrl =
    readString(u, "documentUrl") ||
    readString(u, "fileUrl") ||
    readString(u, "url") ||
    readString(u, "file");
  const id = readString(u, "id") || (u.id != null ? String(u.id) : "");
  if (!id && !documentUrl) return null;
  return {
    id: id || documentUrl,
    documentUrl,
    status: readString(u, "status") || "pending",
    isVerified: readBool(u, "isVerified"),
    uploadedAt:
      readString(u, "uploadedAt") ||
      readString(u, "createdAt") ||
      readString(u, "updatedAt"),
  };
}

export function mapBusinessDocument(raw: unknown): BusinessDocument {
  const record = asRecord(raw);
  const upload = mapUpload(pickUploadRaw(record));

  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name"),
    category: readString(record, "category"),
    notes: readString(record, "notes"),
    isMandatory: readBool(record, "isMandatory"),
    isVerificationRequired: readBool(record, "isVerificationRequired"),
    isUploaded: readBool(record, "isUploaded") || Boolean(upload),
    upload,
  };
}

function asArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const record = asRecord(data);
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.documents)) return record.documents;
  if (Array.isArray(record.businessDocuments)) return record.businessDocuments;
  if (Array.isArray(record.data)) return record.data;
  return [];
}

export async function getDealerProfile(): Promise<DealerProfile> {
  if (isMockMode()) {
    await mockDelay();
    return mockDealerProfile;
  }
  const body = await apiFetch<unknown>("/dealers/user/profile");
  return mapDealerProfile(unwrapApiData(body) ?? body);
}

/** Fetch logged-in dealer company logo (explicit dealer context for header). */
export async function getDealerLogoUrl(dealerId: string): Promise<string> {
  if (isMockMode()) {
    await mockDelay();
    return mockDealerProfile.logoUrl;
  }
  const body = await apiFetch<unknown>("/dealers/user/profile", {
    headers: { "x-dealer-id": dealerId },
  });
  return mapDealerProfile(unwrapApiData(body) ?? body).logoUrl;
}

function brandNamesFromIds(ids: number[]): string {
  return enrichProfileBrandNames(
    { ...mockDealerProfile, brandIds: ids, brandsRepresented: "" },
    mockBrands,
  ).brandsRepresented;
}

function persistSessionLogoUrl(logoUrl: string): void {
  const profile = getProfile();
  if (!profile || !logoUrl.trim()) return;
  setProfile({ ...profile, logoUrl });
}

/**
 * Upload a profile image via `POST /file-upload`, then persist the URL.
 *
 * Persist contract:
 * `PUT /dealers/user/upload-profile-picture` with `{ fileUrl: url }`.
 */
export async function uploadDealerProfilePicture(file: File): Promise<string> {
  if (isMockMode()) {
    await mockDelay();
    const url =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : `https://api.fadaid.com/uploads/mock-profile-${Date.now()}.png`;
    mockDealerProfile.logoUrl = url;
    persistSessionLogoUrl(url);
    return url;
  }

  const uploadedUrl = await apiUploadFile(file);
  const body = await apiFetch<unknown>("/dealers/user/upload-profile-picture", {
    method: "PUT",
    body: { fileUrl: uploadedUrl },
  });

  const data = asRecord(unwrapApiData(body) ?? body);
  const savedUrl =
    readString(data, "fileUrl") ||
    readString(data, "profilePicture") ||
    readString(data, "logoUrl") ||
    readString(data, "file") ||
    readString(data, "url") ||
    uploadedUrl;

  persistSessionLogoUrl(savedUrl);
  return savedUrl;
}

export async function updateDealerProfile(
  input: DealerProfileUpdateInput,
): Promise<DealerProfile> {
  if (isMockMode()) {
    await mockDelay();
    const loc = input.dealerLocations;
    const brandIds = (input.brandsRepresented ?? []).filter(
      (id) => Number.isInteger(id) && id > 0,
    );
    Object.assign(mockDealerProfile, {
      name: input.name,
      phone: input.phone,
      typeOfDealership:
        input.typeOfDealership ?? mockDealerProfile.typeOfDealership,
      yearOfEstablishment: input.yearOfEstablishment,
      panNumber: input.panNumber,
      fadaMembershipId: input.fadaMembershipId,
      fadaMemberSince: input.fadaMemberSince,
      natureOfBusiness: input.natureOfBusiness ?? mockDealerProfile.natureOfBusiness,
      brandIds,
      brandsRepresented:
        brandIds.length > 0
          ? brandNamesFromIds(brandIds)
          : mockDealerProfile.brandsRepresented,
      totalShowrooms: input.totalShowrooms ?? mockDealerProfile.totalShowrooms,
      totalWorkshops: input.totalWorkshops ?? mockDealerProfile.totalWorkshops,
      address: input.address ?? loc?.address ?? mockDealerProfile.address,
      gstNumber: input.gstNumber ?? loc?.gstNumber ?? mockDealerProfile.gstNumber,
      city: input.city ?? loc?.city ?? mockDealerProfile.city,
      state: input.state ?? loc?.state ?? mockDealerProfile.state,
      pinCode: input.pinCode ?? loc?.pinCode ?? mockDealerProfile.pinCode,
      primaryContactName:
        input.primaryContactName ??
        input.primaryContact?.name ??
        mockDealerProfile.primaryContactName,
      primaryContactPhone:
        input.primaryContactPhone ??
        input.primaryContact?.phone ??
        mockDealerProfile.primaryContactPhone,
    });
    return { ...mockDealerProfile };
  }
  const body = await apiFetch<unknown>("/dealers/user/profile", {
    method: "PUT",
    body: toDealerProfileUpdateBody(input),
  });
  return mapDealerProfile(unwrapApiData(body) ?? body);
}

export async function getContactPersons(): Promise<KeyContact[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockContacts;
  }
  const body = await apiFetch<unknown>("/dealers/contact-persons");
  return asArray(unwrapApiData(body)).map(mapKeyContact);
}

export async function createContactPerson(
  input: KeyContactInput,
): Promise<KeyContact> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id: `mock-${Date.now()}`,
      ...input,
      isActive: input.isActive ?? true,
    };
  }
  const body = await apiFetch<unknown>("/dealers/contact-persons", {
    method: "POST",
    body: input,
  });
  return mapKeyContact(unwrapApiData(body) ?? body);
}

export async function updateContactPerson(
  id: string,
  input: KeyContactInput & { isActive: boolean },
): Promise<KeyContact> {
  if (isMockMode()) {
    await mockDelay();
    return { id, ...input };
  }
  const body = await apiFetch<unknown>(`/dealers/contact-persons/${id}`, {
    method: "PUT",
    body: input,
  });
  return mapKeyContact(unwrapApiData(body) ?? body);
}

export async function deleteContactPerson(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/contact-persons/${id}`, { method: "DELETE" });
}

export async function getBusinessDocuments(): Promise<BusinessDocument[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockDocuments;
  }
  const body = await apiFetch<unknown>("/dealers/business-documents");
  return asArray(unwrapApiData(body)).map(mapBusinessDocument);
}

type BusinessDocumentUploadRequest = {
  documentId: number;
  documentUrl: string;
};

function parseDocumentTypeId(documentTypeId: string): number {
  const parsed = Number(documentTypeId);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new ApiError({
      message: "Invalid document type id.",
      status: 400,
      code: "INVALID_DOCUMENT_ID",
    });
  }
  return parsed;
}

export async function uploadBusinessDocument(
  documentTypeId: string,
  file: File,
  options?: { replaceUploadId?: string },
): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    const doc = mockDocuments.find((d) => d.id === documentTypeId);
    if (doc) {
      doc.isUploaded = true;
      doc.upload = {
        id: options?.replaceUploadId ?? `u-${Date.now()}`,
        documentUrl:
          typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
            ? URL.createObjectURL(file)
            : "#",
        status: "pending",
        isVerified: false,
        uploadedAt: new Date().toISOString(),
      };
    }
    return;
  }

  const documentId = parseDocumentTypeId(documentTypeId);

  if (options?.replaceUploadId) {
    await deleteBusinessDocument(options.replaceUploadId);
  }

  const documentUrl = await apiUploadFile(file);
  const body: BusinessDocumentUploadRequest = { documentId, documentUrl };
  await apiFetch("/dealers/business-documents", {
    method: "POST",
    body,
  });
}

export async function deleteBusinessDocument(uploadId: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    const doc = mockDocuments.find((d) => d.upload?.id === uploadId);
    if (doc) {
      doc.isUploaded = false;
      doc.upload = null;
    }
    return;
  }
  await apiFetch(`/dealers/business-documents/${uploadId}`, {
    method: "DELETE",
  });
}

export async function getDealershipPageData(): Promise<DealershipPageData> {
  const [profile, contacts, documents, brandsCatalog] = await Promise.all([
    getDealerProfile(),
    getContactPersons(),
    getBusinessDocuments(),
    getBrands(),
  ]);
  return {
    profile: enrichProfileBrandNames(profile, brandsCatalog),
    contacts,
    documents,
    activity: emptyActivity,
  };
}
