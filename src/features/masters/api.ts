import { apiFetch, isMockMode } from "@/lib/api";
import { buildQuery, mockDelay, unwrapApiData } from "@/lib/api/parse";
import {
  mockBrands,
  mockDepartments,
  mockDesignationsByDepartment,
  mockOutletFunctions,
} from "@/features/masters/mocks/data";
import type { MasterIdNameItem } from "@/features/masters/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function mapMasterItem(raw: unknown): MasterIdNameItem | null {
  const record = asRecord(raw);
  const id =
    readString(record, "id") ||
    readString(record, "value") ||
    (record.id != null ? String(record.id) : "");
  const name =
    readString(record, "name") ||
    readString(record, "label") ||
    id;
  if (!id) return null;
  return { id, name };
}

function parseMasterList(body: unknown): MasterIdNameItem[] {
  const data = unwrapApiData(body);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data).items)
      ? (asRecord(data).items as unknown[])
      : [];

  return rows
    .map(mapMasterItem)
    .filter((item): item is MasterIdNameItem => item != null);
}

/** GET /dealers/masters/departments */
export async function getDepartments(
  parentId?: string | number,
): Promise<MasterIdNameItem[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockDepartments;
  }

  const query = buildQuery({
    parentId: parentId != null && parentId !== "" ? Number(parentId) || parentId : undefined,
  });
  const body = await apiFetch<unknown>(`/dealers/masters/departments${query}`);
  return parseMasterList(body);
}

/** GET /dealers/masters/designations?parentId=departmentId */
export async function getDesignations(
  departmentId: string | number,
): Promise<MasterIdNameItem[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockDesignationsByDepartment[String(departmentId)] ?? [];
  }

  const query = buildQuery({
    parentId: Number(departmentId) || departmentId,
  });
  const body = await apiFetch<unknown>(`/dealers/masters/designations${query}`);
  return parseMasterList(body);
}

/** GET /dealers/masters/brands — active brands for outlet coverage. */
export async function getBrands(): Promise<MasterIdNameItem[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockBrands;
  }

  const body = await apiFetch<unknown>("/dealers/masters/brands");
  return parseMasterList(body);
}

/** GET /dealers/masters/outlet-functions — active outlet functions. */
export async function getOutletFunctions(): Promise<MasterIdNameItem[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockOutletFunctions;
  }

  const body = await apiFetch<unknown>("/dealers/masters/outlet-functions");
  return parseMasterList(body);
}
