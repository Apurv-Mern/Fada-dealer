const LOGO_FIELD_KEYS = [
  "profilePicture",
  "logoUrl",
  "avatarUrl",
  "profileImage",
  "fileUrl",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/** Image URL for display; empty when missing or non-displayable. */
function normalizeImageUrl(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return "";
  return text;
}

function readImageUrl(record: Record<string, unknown>, key: string): string {
  return normalizeImageUrl(record[key]);
}

/**
 * Extract a company logo URL from API payloads (login, profile, upload).
 * Checks top-level record first, then optional nested `profile` object.
 */
export function extractLogoUrl(
  raw: unknown,
  nestedProfile?: unknown,
): string {
  const record = asRecord(raw);
  const profile = nestedProfile != null ? asRecord(nestedProfile) : asRecord(record.profile);

  for (const key of LOGO_FIELD_KEYS) {
    const url = readImageUrl(record, key);
    if (url) return url;
  }

  for (const key of LOGO_FIELD_KEYS) {
    const url = readImageUrl(profile, key);
    if (url) return url;
  }

  return "";
}
