import { isProxyMode } from "@/lib/api/client";

function getDirectApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * Prefer same-origin `/api/...` when the page is not served from the API host
 * (covers dealer.fadaid.com vs api.fadaid.com even if USE_PROXY was false at build).
 */
function shouldPreferSameOriginProxy(): boolean {
  if (isProxyMode()) return true;
  const apiBase = getDirectApiBaseUrl();
  if (!apiBase || typeof window === "undefined") return false;
  try {
    return new URL(apiBase).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** Convert an API-hosted absolute URL (or `/api/...` path) to same-origin `/api/...`. */
function toSameOriginApiFileUrl(raw: string): string | null {
  if (raw.startsWith("/api/") || raw === "/api") return raw;

  const apiBase = getDirectApiBaseUrl();
  if (!apiBase) return null;

  try {
    const absolute = new URL(
      raw,
      typeof window !== "undefined" ? window.location.origin : apiBase,
    );
    const base = new URL(apiBase);
    if (absolute.origin !== base.origin) return null;

    const path = `${absolute.pathname}${absolute.search}${absolute.hash}`;
    return `/api${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return null;
  }
}

/** Absolute API URL for a file path, when possible. */
function toAbsoluteApiFileUrl(raw: string): string | null {
  const apiBase = getDirectApiBaseUrl();
  if (!apiBase) {
    return /^https?:\/\//i.test(raw) ? raw : null;
  }

  try {
    if (raw.startsWith("/api/") || raw === "/api") {
      const path = raw === "/api" ? "/" : raw.slice("/api".length);
      return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
    }

    const absolute = new URL(
      raw,
      typeof window !== "undefined" ? window.location.origin : apiBase,
    );
    const base = new URL(apiBase);
    if (absolute.origin !== base.origin) return null;
    return absolute.href;
  } catch {
    return null;
  }
}

/**
 * Ordered display candidates for an API file URL.
 * Prefer same-origin `/api/...` first (avoids CORP blocks), then absolute.
 */
export function getDisplayableFileUrlCandidates(
  url: string | null | undefined,
): string[] {
  const raw = String(url ?? "").trim();
  if (!raw) return [];

  if (raw.startsWith("blob:") || raw.startsWith("data:")) {
    return [raw];
  }

  const sameOrigin = toSameOriginApiFileUrl(raw);
  const absolute = toAbsoluteApiFileUrl(raw);

  if (shouldPreferSameOriginProxy()) {
    return uniqueUrls([sameOrigin ?? "", absolute ?? "", raw]);
  }

  return uniqueUrls([absolute ?? "", raw, sameOrigin ?? ""]);
}

/**
 * Best single display URL for an API-hosted file.
 * Example: `https://api.fadaid.com/uploads/x.png` → `/api/uploads/x.png`
 * when the portal origin differs from the API (or proxy mode is on).
 */
export function toDisplayableFileUrl(url: string | null | undefined): string {
  return getDisplayableFileUrlCandidates(url)[0] ?? "";
}
