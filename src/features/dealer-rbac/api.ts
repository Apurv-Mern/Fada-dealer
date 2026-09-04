import { apiFetch, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import {
  buildQuery,
  mockDelay,
  unwrapApiData,
} from "@/lib/api/parse";
import {
  addMockPortalRole,
  getMockRoleById,
  mockPortalModules,
  mockPortalRoles,
  removeMockPortalRole,
  updateMockPortalRole,
} from "@/features/dealer-rbac/mocks/data";
import type {
  PortalModule,
  PortalPermission,
  PortalRole,
  PortalRoleInput,
  PortalRoleListParams,
  PortalRolePageData,
} from "@/features/dealer-rbac/types";

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 10;

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

function readPermissions(record: Record<string, unknown>): string[] {
  const value = record.permissions;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function mapApiPortalPermission(raw: unknown): PortalPermission {
  const record = asRecord(raw);
  const action = readString(record, "action");
  const normalizedAction =
    action === "view" ||
    action === "edit" ||
    action === "manage" ||
    action === "create" ||
    action === "delete" ||
    action === "export"
      ? action
      : "view";
  return {
    key: readString(record, "key"),
    name: readString(record, "name"),
    action: normalizedAction,
  };
}

export function mapApiPortalModule(raw: unknown): PortalModule {
  const record = asRecord(raw);
  const permissionsRaw = record.permissions;
  const permissions = Array.isArray(permissionsRaw)
    ? permissionsRaw.map(mapApiPortalPermission).filter((p) => p.key)
    : [];

  return {
    key: readString(record, "key"),
    name: readString(record, "name"),
    sortOrder: Number(record.sortOrder) || 0,
    permissions,
  };
}

export function mapApiPortalRole(raw: unknown): PortalRole {
  const record = asRecord(raw);
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    key: readString(record, "key"),
    name: readString(record, "name"),
    description: readString(record, "description") || undefined,
    isSystem: readBool(record, "isSystem"),
    isSuperRole: readBool(record, "isSuperRole"),
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
    permissions: readPermissions(record),
    createdAt: readString(record, "createdAt") || undefined,
    updatedAt: readString(record, "updatedAt") || undefined,
  };
}

function paginateRoles(
  rows: PortalRole[],
  params: PortalRoleListParams = {},
): PortalRolePageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  let filtered = rows;
  if (params.isActive !== undefined) {
    filtered = filtered.filter((role) => role.isActive === params.isActive);
  }
  if (q) {
    filtered = filtered.filter((role) =>
      `${role.name} ${role.key} ${role.description ?? ""}`
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

export async function getPortalModules(): Promise<PortalModule[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockPortalModules.map((module) => ({
      ...module,
      permissions: module.permissions.map((p) => ({ ...p })),
    }));
  }

  const body = await apiFetch<unknown>("/dealers/modules");
  const data = unwrapApiData(body) ?? body;
  if (!Array.isArray(data)) return [];
  return data.map(mapApiPortalModule).filter((module) => module.key);
}

export async function getRolesPage(
  params?: PortalRoleListParams,
): Promise<PortalRolePageData> {
  if (isMockMode()) {
    await mockDelay();
    return paginateRoles(mockPortalRoles.map((role) => ({ ...role })), params);
  }

  const page = params?.page ?? DEFAULT_PAGE;
  const pageSize = params?.pageSize ?? PAGE_SIZE;
  const query = buildQuery({
    search: params?.q,
    isActive: params?.isActive,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const body = await apiFetch<unknown>(`/dealers/roles${query}`);
  const envelope = asRecord(body);
  const data = asRecord(envelope.data ?? unwrapApiData(body));
  const rolesRaw = data.roles;
  const pagination = asRecord(data.pagination);
  const items = Array.isArray(rolesRaw)
    ? rolesRaw.map(mapApiPortalRole).filter((role) => role.id)
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

export async function getRole(id: string): Promise<PortalRole> {
  if (isMockMode()) {
    await mockDelay();
    const role = mockPortalRoles.find((row) => row.id === id);
    if (!role) {
      throw new ApiError({ message: "Role not found", status: 404 });
    }
    return { ...role, permissions: [...role.permissions] };
  }

  const body = await apiFetch<unknown>(`/dealers/roles/${id}`);
  return mapApiPortalRole(unwrapApiData(body) ?? body);
}

export async function createRole(input: PortalRoleInput): Promise<PortalRole> {
  if (isMockMode()) {
    await mockDelay(220);
    const key = input.key?.trim().toLowerCase() ?? "";
    if (!key) {
      throw new ApiError({ message: "Role key is required", status: 422 });
    }
    if (mockPortalRoles.some((role) => role.key === key)) {
      throw new ApiError({ message: "Role key already exists", status: 409 });
    }
    const created: PortalRole = {
      id: `role-${Date.now()}`,
      key,
      name: input.name.trim(),
      description: input.description?.trim(),
      isSystem: false,
      isSuperRole: false,
      isActive: input.isActive ?? true,
      permissions: [...input.permissions],
      createdAt: new Date().toISOString(),
    };
    addMockPortalRole(created);
    return created;
  }

  const body = await apiFetch<unknown>("/dealers/roles", {
    method: "POST",
    body: {
      key: input.key?.trim(),
      name: input.name.trim(),
      description: input.description?.trim(),
      permissions: input.permissions,
      isActive: input.isActive ?? true,
    },
  });
  return mapApiPortalRole(unwrapApiData(body) ?? body);
}

export async function updateRole(
  id: string,
  input: PortalRoleInput,
): Promise<PortalRole> {
  if (isMockMode()) {
    await mockDelay(200);
    const current = getMockRoleById(id);
    if (!current) {
      throw new ApiError({ message: "Role not found", status: 404 });
    }
    const next: PortalRole = {
      ...current,
      name: input.name.trim(),
      description: input.description?.trim(),
      isActive: input.isActive ?? current.isActive,
      permissions: current.isSuperRole
        ? [...current.permissions]
        : [...input.permissions],
      updatedAt: new Date().toISOString(),
    };
    updateMockPortalRole(id, next);
    return next;
  }

  const body = await apiFetch<unknown>(`/dealers/roles/${id}`, {
    method: "PUT",
    body: {
      name: input.name.trim(),
      description: input.description?.trim(),
      permissions: input.permissions,
      isActive: input.isActive ?? true,
    },
  });
  return mapApiPortalRole(unwrapApiData(body) ?? body);
}

export async function deleteRole(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay(180);
    const current = getMockRoleById(id);
    if (!current) {
      throw new ApiError({ message: "Role not found", status: 404 });
    }
    if (current.isSystem) {
      throw new ApiError({
        message: "System roles cannot be deleted",
        status: 400,
      });
    }
    removeMockPortalRole(id);
    return;
  }

  await apiFetch(`/dealers/roles/${id}`, { method: "DELETE" });
}
