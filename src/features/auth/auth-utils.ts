import type { AuthTokenResponse } from "@/types/api";

export type SessionPayload = {
  email: string;
  name: string;
  role: string;
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
    "Dealer";

  const role =
    (typeof dealer?.role === "string" && dealer.role) ||
    readStringField(data, "role") ||
    (typeof user?.role === "string" && user.role) ||
    "Dealer Admin";

  return { email, name, role };
}
