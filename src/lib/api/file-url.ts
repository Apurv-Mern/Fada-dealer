import { getApiBaseUrl, isProxyMode } from "@/lib/api/client";

function getDirectApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

/**
 * Rewrite absolute API-hosted file URLs to same-origin `/api/...` when proxy
 * mode is on, so `<img>` loads are not blocked by the API's
 * `Cross-Origin-Resource-Policy: same-origin`.
 *
 * Example: `https://api.fadaid.com/uploads/x.png` → `/api/uploads/x.png`
 */
export function toDisplayableFileUrl(url: string | null | undefined): string {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  if (!isProxyMode()) return raw;

  const apiBase = getDirectApiBaseUrl();
  if (!apiBase) return raw;

  // Already same-origin proxy path.
  if (raw.startsWith("/api/") || raw === "/api") return raw;

  try {
    const absolute = new URL(raw, typeof window !== "undefined" ? window.location.origin : apiBase);
    const base = new URL(apiBase);
    if (absolute.origin !== base.origin) return raw;

    const path = `${absolute.pathname}${absolute.search}${absolute.hash}`;
    const proxyBase = getApiBaseUrl().replace(/\/$/, "") || "/api";
    return `${proxyBase}${path.startsWith("/") ? path : `/${path}`}`;
  } catch {
    return raw;
  }
}
