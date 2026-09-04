import { apiFetch, isMockMode } from "@/lib/api";
import { mockDelay, unwrapApiData } from "@/lib/api/parse";
import {
  ALL_DEALER_PERMISSIONS,
  resolvePrimaryDealerPermissions,
} from "@/features/auth/permissions";
import { getMockRoleById } from "@/features/dealer-rbac/mocks/data";

export type ResolvedRolePermissions = {
  roleKey: string;
  roleLabel: string;
  permissions: string[];
  isSuperRole: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
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

export function mapApiRolePermissions(raw: unknown): ResolvedRolePermissions {
  const record = asRecord(raw);
  const key = readString(record, "key") || "dealer_viewer";
  const name = readString(record, "name") || key;
  const isSuperRole = readBool(record, "isSuperRole");
  const permissions = readPermissions(record);

  return {
    roleKey: key,
    roleLabel: name,
    permissions: isSuperRole
      ? resolvePrimaryDealerPermissions()
      : permissions.length > 0
        ? permissions
        : [...ALL_DEALER_PERMISSIONS],
    isSuperRole,
  };
}

export async function fetchRolePermissions(
  roleId: number,
  accessToken: string,
): Promise<ResolvedRolePermissions> {
  if (isMockMode()) {
    await mockDelay(80);
    const role = getMockRoleById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }
    return mapApiRolePermissions(role);
  }

  const body = await apiFetch<unknown>(`/dealers/roles/${roleId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    skipAuth: true,
  });
  return mapApiRolePermissions(unwrapApiData(body) ?? body);
}
