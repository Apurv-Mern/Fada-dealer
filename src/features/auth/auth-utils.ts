import type { AuthTokenResponse } from "@/types/api";

export type SessionPayload = {
  email: string;
  name: string;
  role: string;
  /** Dealer id from login (stringified). */
  id?: string;
  /** When true, portal may load group dealers for the navbar list. */
  isGroupHoldingEntity?: boolean;
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

/** Map API role enums to user-facing session labels. */
export function formatSessionRole(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized === "dealer" || normalized === "dealer_admin") {
    return "Company Admin";
  }
  return role.trim();
}

export function sessionFromAuthBody(
  body: AuthTokenResponse,
  fallbackEmail: string,
): SessionPayload {
  const dealer = body.dealer;
  const data = body.data as Record<string, unknown> | null | undefined;
  const user = body.data?.user;

  const email =
    (typeof dealer?.email === "string" && dealer.email) ||
    readStringField(data, "email") ||
    (typeof user?.email === "string" && user.email) ||
    fallbackEmail;

  const name =
    (typeof dealer?.name === "string" && dealer.name) ||
    readStringField(data, "name") ||
    (typeof user?.name === "string" && user.name) ||
    fallbackEmail.split("@")[0] ||
    "Company";

  const rawRole =
    (typeof dealer?.role === "string" && dealer.role) ||
    readStringField(data, "role") ||
    (typeof user?.role === "string" && user.role) ||
    "Company Admin";
  const role = formatSessionRole(rawRole);

  const dealerRecord = dealer as Record<string, unknown> | null | undefined;
  const idFromDealer =
    dealer?.id != null && String(dealer.id).trim()
      ? String(dealer.id)
      : undefined;
  const idFromData =
    data?.id != null && String(data.id).trim() ? String(data.id) : undefined;
  const id = idFromDealer || idFromData;

  const isGroupHoldingEntity =
    readBooleanField(dealerRecord, "isGroupHoldingEntity") ??
    readBooleanField(data, "isGroupHoldingEntity");

  return {
    email,
    name,
    role,
    ...(id ? { id } : {}),
    ...(isGroupHoldingEntity !== undefined ? { isGroupHoldingEntity } : {}),
  };
}
