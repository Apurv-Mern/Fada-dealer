import { apiFetch, apiUploadFile, isMockMode } from "@/lib/api";
import { mockDelay, unwrapApiData } from "@/lib/api/parse";
import {
  emptyActivity,
  mockContacts,
  mockDealerProfile,
  mockDocuments,
} from "@/features/dealership/mocks/data";
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

export function mapDealerProfile(raw: unknown): DealerProfile {
  const record = asRecord(raw);
  const profile = asRecord(record.profile);
  const location = asRecord(
    record.dealerLocations ?? record.registeredAddress ?? record.location,
  );

  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name"),
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    dealerCode: readString(record, "dealerCode"),
    status: readString(record, "status") || "pending",
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
    totalOutlets: readNumber(record, "totalOutlets"),
    allEmployees:
      readNumber(record, "allEmployees") ||
      readNumber(record, "totalActiveEmployees"),
    typeOfDealership:
      readString(profile, "typeOfDealership") ||
      readString(record, "typeOfDealership"),
    yearOfEstablishment: String(
      profile.yearOfEstablishment ??
        record.yearOfEstablishment ??
        "",
    ),
    panNumber: readString(profile, "panNumber") || readString(record, "panNumber"),
    fadaMembershipId:
      readString(profile, "fadaMembershipId") ||
      readString(record, "fadaMembershipId"),
    fadaMemberSince:
      readString(profile, "fadaMemberSince") ||
      readString(record, "fadaMemberSince"),
    address: readString(location, "address"),
    city: readString(location, "city"),
    state: readString(location, "state"),
    pinCode: readString(location, "pinCode"),
    country: readString(location, "country") || "India",
    gstNumber: readString(location, "gstNumber"),
    logoUrl:
      readString(record, "logoUrl") ||
      readString(record, "avatarUrl") ||
      readString(record, "profileImage") ||
      readString(profile, "logoUrl") ||
      readString(profile, "avatarUrl") ||
      readString(profile, "profileImage"),
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

export function mapBusinessDocument(raw: unknown): BusinessDocument {
  const record = asRecord(raw);
  const uploadRaw = record.upload;
  let upload: BusinessDocument["upload"] = null;
  if (uploadRaw && typeof uploadRaw === "object") {
    const u = asRecord(uploadRaw);
    upload = {
      id: readString(u, "id") || String(u.id ?? ""),
      documentUrl: readString(u, "documentUrl"),
      status: readString(u, "status") || "pending",
      isVerified: readBool(u, "isVerified"),
      uploadedAt:
        readString(u, "uploadedAt") ||
        readString(u, "createdAt") ||
        readString(u, "updatedAt"),
    };
  }

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

export async function updateDealerProfile(
  input: DealerProfileUpdateInput,
): Promise<DealerProfile> {
  if (isMockMode()) {
    await mockDelay();
    return { ...mockDealerProfile, ...input };
  }
  const body = await apiFetch<unknown>("/dealers/user/profile", {
    method: "PUT",
    body: input,
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

export async function uploadBusinessDocument(
  documentId: string,
  file: File,
): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  const documentUrl = await apiUploadFile(file);
  await apiFetch("/dealers/business-documents", {
    method: "POST",
    body: { documentId: Number(documentId) || documentId, documentUrl },
  });
}

export async function deleteBusinessDocument(uploadId: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/business-documents/${uploadId}`, {
    method: "DELETE",
  });
}

export async function getDealershipPageData(): Promise<DealershipPageData> {
  const [profile, contacts, documents] = await Promise.all([
    getDealerProfile(),
    getContactPersons(),
    getBusinessDocuments(),
  ]);
  return { profile, contacts, documents, activity: emptyActivity };
}
