import { apiFetch, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import {
  buildQuery,
  mockDelay,
  unwrapApiData,
} from "@/lib/api/parse";
import {
  addMockStaffMember,
  getMockStaffRole,
  mockStaffMembers,
  mockStaffRoles,
  removeMockStaffMember,
  updateMockStaffMember,
} from "@/features/dealer-staff/mocks/data";
import type {
  StaffCreateInput,
  StaffListParams,
  StaffMember,
  StaffPageData,
  StaffRole,
  StaffUpdateInput,
} from "@/features/dealer-staff/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readBool(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return value === true || value === "true" || value === 1;
}

export function mapApiStaffRole(raw: unknown): StaffRole {
  const record = asRecord(raw);
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name") || "Role",
    key: readString(record, "key"),
    description: readString(record, "description") || undefined,
    isSuperRole: readBool(record, "isSuperRole"),
  };
}

export function mapApiStaffMember(raw: unknown): StaffMember {
  const record = asRecord(raw);
  const roleRaw = record.role;
  const roleId =
    readString(record, "roleId") ||
    (roleRaw ? readString(asRecord(roleRaw), "id") : "");
  const role = roleRaw
    ? mapApiStaffRole(roleRaw)
    : {
        id: roleId,
        name: "Role",
        key: "",
      };

  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name") || "Staff",
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    roleId: roleId || role.id,
    role,
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
    isEmailVerified: readBool(record, "isEmailVerified") || undefined,
    createdAt: readString(record, "createdAt") || undefined,
    updatedAt: readString(record, "updatedAt") || undefined,
  };
}

function paginateStaff(
  rows: StaffMember[],
  params: StaffListParams = {},
): StaffPageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  let filtered = rows;
  if (params.isActive !== undefined) {
    filtered = filtered.filter((member) => member.isActive === params.isActive);
  }
  if (params.roleId) {
    filtered = filtered.filter((member) => member.roleId === params.roleId);
  }
  if (q) {
    filtered = filtered.filter((member) =>
      `${member.name} ${member.email} ${member.phone} ${member.role.name}`
        .toLowerCase()
        .includes(q),
    );
  }
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return {
    list: {
      items: filtered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    },
  };
}

export async function getStaffRoles(): Promise<StaffRole[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockStaffRoles.map((role) => ({ ...role }));
  }

  const body = await apiFetch<unknown>("/dealers/staff/roles");
  const data = unwrapApiData(body) ?? body;
  if (!Array.isArray(data)) return [];
  return data.map(mapApiStaffRole).filter((role) => role.id);
}

export async function getStaffPage(
  params?: StaffListParams,
): Promise<StaffPageData> {
  if (isMockMode()) {
    await mockDelay();
    return paginateStaff(mockStaffMembers.map((member) => ({ ...member })), params);
  }

  const page = params?.page ?? DEFAULT_PAGE;
  const pageSize = params?.pageSize ?? DEFAULT_PAGE_SIZE;
  const query = buildQuery({
    search: params?.q,
    roleId: params?.roleId,
    isActive: params?.isActive,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const body = await apiFetch<unknown>(`/dealers/staff${query}`);
  const envelope = asRecord(body);
  const data = asRecord(envelope.data ?? unwrapApiData(body));
  const staffRaw = data.staff;
  const pagination = asRecord(data.pagination);
  const items = Array.isArray(staffRaw)
    ? staffRaw.map(mapApiStaffMember).filter((member) => member.id)
    : [];
  const total = Number(pagination.total) || items.length;
  const limit = Number(pagination.limit) || pageSize;
  const offset = Number(pagination.offset) || 0;

  return {
    list: {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    },
  };
}

export async function getStaff(id: string): Promise<StaffMember> {
  if (isMockMode()) {
    await mockDelay();
    const member = mockStaffMembers.find((row) => row.id === id);
    if (!member) {
      throw new ApiError({ message: "Staff member not found", status: 404 });
    }
    return { ...member, role: { ...member.role } };
  }

  const body = await apiFetch<unknown>(`/dealers/staff/${id}`);
  return mapApiStaffMember(unwrapApiData(body) ?? body);
}

export async function createStaff(input: StaffCreateInput): Promise<StaffMember> {
  const email = input.email.trim().toLowerCase();
  if (isMockMode()) {
    await mockDelay(220);
    if (mockStaffMembers.some((member) => member.email.toLowerCase() === email)) {
      throw new ApiError({ message: "Email already exists", status: 409 });
    }
    const role = getMockStaffRole(input.roleId);
    if (!role) {
      throw new ApiError({ message: "Invalid role", status: 422 });
    }
    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      roleId: input.roleId,
      role,
      isActive: input.isActive ?? true,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
    };
    addMockStaffMember(created);
    return created;
  }

  const body = await apiFetch<unknown>("/dealers/staff", {
    method: "POST",
    body: {
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      roleId: Number(input.roleId),
      password: input.password,
      confirmPassword: input.confirmPassword,
      isActive: input.isActive ?? true,
    },
  });
  return mapApiStaffMember(unwrapApiData(body) ?? body);
}

export async function updateStaff(
  id: string,
  input: StaffUpdateInput,
): Promise<StaffMember> {
  if (isMockMode()) {
    await mockDelay(200);
    const current = mockStaffMembers.find((member) => member.id === id);
    if (!current) {
      throw new ApiError({ message: "Staff member not found", status: 404 });
    }
    const role = getMockStaffRole(input.roleId) ?? current.role;
    const next: StaffMember = {
      ...current,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      roleId: input.roleId,
      role,
      isActive: input.isActive ?? current.isActive,
      updatedAt: new Date().toISOString(),
    };
    updateMockStaffMember(id, next);
    return next;
  }

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    roleId: Number(input.roleId),
    isActive: input.isActive ?? true,
  };
  if (input.password?.trim()) {
    payload.password = input.password;
    payload.confirmPassword = input.confirmPassword;
  }

  const body = await apiFetch<unknown>(`/dealers/staff/${id}`, {
    method: "PUT",
    body: payload,
  });
  return mapApiStaffMember(unwrapApiData(body) ?? body);
}

export async function deleteStaff(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay(180);
    const current = mockStaffMembers.find((member) => member.id === id);
    if (!current) {
      throw new ApiError({ message: "Staff member not found", status: 404 });
    }
    removeMockStaffMember(id);
    return;
  }

  await apiFetch(`/dealers/staff/${id}`, { method: "DELETE" });
}

export async function toggleStaffActive(id: string): Promise<boolean> {
  if (isMockMode()) {
    await mockDelay(160);
    const current = mockStaffMembers.find((member) => member.id === id);
    if (!current) {
      throw new ApiError({ message: "Staff member not found", status: 404 });
    }
    const next = { ...current, isActive: !current.isActive };
    updateMockStaffMember(id, next);
    return next.isActive;
  }

  const body = await apiFetch<unknown>(`/dealers/staff/${id}/active-inactive`, {
    method: "PUT",
  });
  const data = asRecord(unwrapApiData(body) ?? body);
  return readBool(data, "isActive");
}
