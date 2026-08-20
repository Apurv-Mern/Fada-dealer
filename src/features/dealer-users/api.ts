import { apiFetch, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";
import {
  buildQuery,
  mockDelay,
  normalizeListPayload,
  unwrapApiData,
} from "@/lib/api/parse";
import {
  addMockDealerUser,
  countActiveAdmins,
  mockDealerUsers,
  updateMockDealerUser,
} from "@/features/dealer-users/mocks/data";
import {
  parseUserRole,
  type DealerUser,
  type DealerUserInput,
  type DealerUserListParams,
  type DealerUserPageData,
} from "@/features/dealer-users/types";

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

export function mapApiDealerUser(raw: unknown): DealerUser {
  const record = asRecord(raw);
  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name") || "User",
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    role: parseUserRole(readString(record, "role")),
    isActive: "isActive" in record ? readBool(record, "isActive") : true,
    lastLoginAt: readString(record, "lastLoginAt") || undefined,
    createdAt: readString(record, "createdAt") || undefined,
  };
}

function paginate(
  rows: DealerUser[],
  params: DealerUserListParams = {},
): DealerUserPageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  let filtered = rows;
  if (params.isActive !== undefined) {
    filtered = filtered.filter((u) => u.isActive === params.isActive);
  }
  if (q) {
    filtered = filtered.filter((u) =>
      `${u.name} ${u.email} ${u.phone} ${u.role}`.toLowerCase().includes(q),
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
    activeAdminCount: countActiveAdmins(),
  };
}

export async function getDealerUsersPage(
  params?: DealerUserListParams,
): Promise<DealerUserPageData> {
  if (isMockMode()) {
    await mockDelay();
    return paginate(mockDealerUsers.map((u) => ({ ...u })), params);
  }

  const query = buildQuery({
    search: params?.q,
    isActive: params?.isActive,
    page: params?.page ?? DEFAULT_PAGE,
    pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
  });
  const body = await apiFetch<unknown>(`/dealers/users${query}`);
  const normalized = normalizeListPayload(body, {
    page: params?.page ?? DEFAULT_PAGE,
    pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
  });
  const items = normalized.items.map(mapApiDealerUser).filter((u) => u.id);
  const onPageAdmins = items.filter(
    (u) => u.role === "dealer_admin" && u.isActive,
  ).length;
  return {
    list: {
      items,
      total: normalized.total,
      page: normalized.page,
      pageSize: normalized.pageSize,
    },
    activeAdminCount:
      normalized.total <= items.length ? onPageAdmins : Math.max(onPageAdmins, 2),
  };
}

export async function inviteDealerUser(input: DealerUserInput): Promise<DealerUser> {
  const email = input.email?.trim().toLowerCase() ?? "";
  if (isMockMode()) {
    await mockDelay(220);
    if (mockDealerUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new ApiError({ message: "Email already exists", status: 409 });
    }
    const created: DealerUser = {
      id: `user-${Date.now()}`,
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      role: input.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    addMockDealerUser(created);
    return created;
  }

  const body = await apiFetch<unknown>("/dealers/users", {
    method: "POST",
    body: {
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      role: input.role,
    },
  });
  return mapApiDealerUser(unwrapApiData(body) ?? body);
}

export async function updateDealerUser(
  id: string,
  input: DealerUserInput,
): Promise<DealerUser> {
  if (isMockMode()) {
    await mockDelay(200);
    const current = mockDealerUsers.find((u) => u.id === id);
    if (!current) {
      throw new ApiError({ message: "User not found", status: 404 });
    }
    const nextActive = input.isActive ?? current.isActive;
    if (
      current.role === "dealer_admin" &&
      current.isActive &&
      nextActive === false &&
      countActiveAdmins(id) === 0
    ) {
      throw new ApiError({
        message: "Cannot deactivate the last company admin",
        status: 409,
      });
    }
    const next: DealerUser = {
      ...current,
      name: input.name.trim(),
      phone: input.phone.trim(),
      role: input.role,
      isActive: nextActive,
    };
    updateMockDealerUser(id, next);
    return next;
  }

  const body = await apiFetch<unknown>(`/dealers/users/${id}`, {
    method: "PUT",
    body: {
      name: input.name.trim(),
      phone: input.phone.trim(),
      role: input.role,
      isActive: input.isActive ?? true,
    },
  });
  return mapApiDealerUser(unwrapApiData(body) ?? body);
}

export function isLastActiveAdmin(users: DealerUser[], user: DealerUser): boolean {
  if (user.role !== "dealer_admin" || !user.isActive) return false;
  return users.filter((u) => u.role === "dealer_admin" && u.isActive).length <= 1;
}
