import type { AuthTokenResponse } from "@/types/api";
import {
  ALL_DEALER_PERMISSIONS,
  resolvePrimaryDealerPermissions,
} from "@/features/auth/permissions";
import { extractLogoUrl } from "@/lib/logo-url";

export type UserType = "dealer" | "staff";

export type SessionPayload = {
  email: string;
  name: string;
  /** Display label in header (e.g. Dealer Admin, Sales Lead). */
  roleLabel: string;
  /** Dealer or staff account id (stringified). */
  id?: string;
  userType: UserType;
  roleId?: number;
  roleKey?: string;
  parentDealerId?: string;
  permissions: string[];
  isGroupHoldingEntity?: boolean;
  isSuperRole?: boolean;
  /** Company logo URL for header avatar (from login or profile API). */
  logoUrl?: string;
};

function readStringField(
  source: Record<string, unknown> | null | undefined,
  key: string,
): string | undefined {
  if (!source) return undefined;
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBooleanField(
  source: Record<string, unknown> | null | undefined,
  key: string,
): boolean | undefined {
  if (!source) return undefined;
  const value = source[key];
  return typeof value === "boolean" ? value : undefined;
}

function readNumberField(
  source: Record<string, unknown> | null | undefined,
  key: string,
): number | undefined {
  if (!source) return undefined;
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function readUserType(
  source: Record<string, unknown> | null | undefined,
): UserType {
  const raw = readStringField(source, "userType")?.toLowerCase();
  return raw === "staff" ? "staff" : "dealer";
}

function readPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Map legacy role strings to display labels. */
export function formatRoleLabel(roleKey: string): string {
  const normalized = roleKey.trim().toLowerCase();
  if (normalized === "dealer" || normalized === "dealer_admin") {
    return "Dealer Admin";
  }
  if (normalized === "hr" || normalized === "dealer_manager") {
    return "Dealer Manager";
  }
  if (normalized === "viewer" || normalized === "dealer_viewer") {
    return "Dealer Viewer";
  }
  return roleKey.trim() || "Portal User";
}

/**
 * Email verification flag from password / OTP login envelopes.
 * Order: dealer → data → data.user.
 */
export function extractIsEmailVerified(
  body: AuthTokenResponse,
): boolean | undefined {
  const fromDealer = readBooleanField(
    body.dealer as Record<string, unknown> | null | undefined,
    "isEmailVerified",
  );
  if (fromDealer !== undefined) return fromDealer;

  const fromData = readBooleanField(
    body.data as Record<string, unknown> | null | undefined,
    "isEmailVerified",
  );
  if (fromData !== undefined) return fromData;

  return readBooleanField(
    body.data?.user as Record<string, unknown> | null | undefined,
    "isEmailVerified",
  );
}

export function extractTokensFromAuthBody(body: AuthTokenResponse): {
  accessToken?: string;
  refreshToken?: string;
} {
  const accessToken =
    body.accessToken ??
    (typeof body.data?.accessToken === "string"
      ? body.data.accessToken
      : undefined);
  const refreshToken =
    body.refreshToken ??
    (typeof body.data?.refreshToken === "string"
      ? body.data.refreshToken
      : undefined);
  return { accessToken, refreshToken };
}

function pickAuthRecord(body: AuthTokenResponse): Record<string, unknown> {
  const dealer = body.dealer as Record<string, unknown> | null | undefined;
  const data = body.data as Record<string, unknown> | null | undefined;
  const user = body.data?.user as Record<string, unknown> | null | undefined;
  return { ...user, ...data, ...dealer };
}

export function sessionFromAuthBody(
  body: AuthTokenResponse,
  fallbackEmail: string,
  overrides?: Partial<Pick<SessionPayload, "permissions" | "roleKey" | "roleLabel" | "isSuperRole">>,
): SessionPayload {
  const record = pickAuthRecord(body);

  const email =
    readStringField(record, "email") ||
    fallbackEmail;

  const name =
    readStringField(record, "name") ||
    fallbackEmail.split("@")[0] ||
    "Company";

  const userType = readUserType(record);
  const roleId = readNumberField(record, "roleId");
  const rawRole =
    readStringField(record, "roleKey") ||
    readStringField(record, "role") ||
    (userType === "dealer" ? "dealer_admin" : "dealer_viewer");

  const roleKey = rawRole.trim().toLowerCase();
  const roleLabel = overrides?.roleLabel ?? formatRoleLabel(roleKey);
  const isSuperRole =
    overrides?.isSuperRole ??
    (userType === "dealer" || roleKey === "dealer_admin");

  const idFromRecord =
    record.id != null && String(record.id).trim()
      ? String(record.id)
      : undefined;

  const parentDealerIdRaw = readNumberField(record, "parentDealerId");
  const parentDealerId =
    parentDealerIdRaw != null ? String(parentDealerIdRaw) : undefined;

  const isGroupHoldingEntity = readBooleanField(record, "isGroupHoldingEntity");

  const permissionsFromBody = readPermissions(record.permissions);
  const permissions =
    overrides?.permissions ??
    (permissionsFromBody.length > 0
      ? permissionsFromBody
      : isSuperRole
        ? resolvePrimaryDealerPermissions()
        : []);

  const logoUrl = extractLogoUrl(record);

  return {
    email,
    name,
    roleLabel,
    ...(idFromRecord ? { id: idFromRecord } : {}),
    userType,
    ...(roleId != null ? { roleId } : {}),
    roleKey,
    ...(parentDealerId ? { parentDealerId } : {}),
    permissions,
    ...(isGroupHoldingEntity !== undefined ? { isGroupHoldingEntity } : {}),
    isSuperRole,
    ...(logoUrl ? { logoUrl } : {}),
  };
}

/** Upgrade legacy stored profiles (pre-RBAC) to the new SessionPayload shape. */
export function normalizeStoredProfile(raw: unknown): SessionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown> & {
    role?: string;
    roleLabel?: string;
    permissions?: unknown;
    userType?: string;
  };

  if (!data.email || !data.name) return null;

  const legacyRole = typeof data.role === "string" ? data.role : undefined;
  const roleLabel =
    typeof data.roleLabel === "string"
      ? data.roleLabel
      : legacyRole
        ? formatRoleLabel(legacyRole)
        : "Portal User";

  const userType: UserType =
    data.userType === "staff" ? "staff" : "dealer";

  const permissions = readPermissions(data.permissions);
  const isSuperRole =
    data.isSuperRole === true ||
    userType === "dealer" ||
    legacyRole?.toLowerCase() === "dealer_admin" ||
    legacyRole === "Company Admin";

  return {
    email: String(data.email),
    name: String(data.name),
    roleLabel,
    id: data.id != null ? String(data.id) : undefined,
    userType,
    roleId:
      typeof data.roleId === "number"
        ? data.roleId
        : typeof data.roleId === "string"
          ? Number(data.roleId) || undefined
          : undefined,
    roleKey:
      typeof data.roleKey === "string"
        ? data.roleKey
        : legacyRole?.toLowerCase(),
    parentDealerId:
      data.parentDealerId != null ? String(data.parentDealerId) : undefined,
    permissions:
      permissions.length > 0
        ? permissions
        : isSuperRole
          ? resolvePrimaryDealerPermissions()
          : ALL_DEALER_PERMISSIONS.filter((key) => key.endsWith(".view")),
    isGroupHoldingEntity:
      typeof data.isGroupHoldingEntity === "boolean"
        ? data.isGroupHoldingEntity
        : undefined,
    isSuperRole,
    logoUrl:
      typeof data.logoUrl === "string" && data.logoUrl.trim()
        ? data.logoUrl.trim()
        : undefined,
  };
}

/** Dealer id for company-scoped API calls (header logo, etc.). */
export function resolveSessionDealerId(
  profile: SessionPayload | null | undefined,
): string | undefined {
  if (!profile) return undefined;
  if (profile.userType === "staff" && profile.parentDealerId?.trim()) {
    return profile.parentDealerId.trim();
  }
  return profile.id?.trim() || undefined;
}
