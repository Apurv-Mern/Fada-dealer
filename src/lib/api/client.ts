import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/features/auth/token-store";
import { forceLocalLogout } from "@/features/auth/force-logout";

/** Same-origin `/api/*` → Nginx / next rewrite (avoids CORS). */
export function isProxyMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_PROXY === "true";
}

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
}

function getDirectApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

/**
 * Browser API base.
 * - Proxy on → `/api` (same origin; Nginx or next.dev rewrites to Node)
 * - Proxy off → `NEXT_PUBLIC_API_URL`
 */
export function getApiBaseUrl(): string {
  if (isProxyMode()) return "/api";
  return getDirectApiBaseUrl();
}

/** True when dealer auth should call the Node API (proxy or direct URL). */
export function isRealDealerAuthEnabled(): boolean {
  return isProxyMode() || Boolean(getDirectApiBaseUrl());
}

/** Attach Bearer token for API calls. */
export function bearerAuthHeader(
  accessToken: string | null | undefined,
): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Skip attaching Bearer from token store (e.g. login/register). */
  skipAuth?: boolean;
};

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const { skipAuth, body, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...rest,
    credentials: "omit",
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = response.statusText || "Request failed";
    let code: string | undefined;
    try {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
        success?: boolean;
      };
      message = extractErrorMessage(data, message);
      code = data.code;
    } catch {
      // ignore parse errors
    }

    // No silent refresh yet — refreshToken may be stored for a future renew flow.
    // Authenticated 401 → clear session and hard-redirect to login.
    if (!skipAuth && response.status === 401) {
      forceLocalLogout("session");
    }

    throw new ApiError({ message, code, status: response.status });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Upload a file via multipart FormData to Node `POST /file-upload`.
 * Returns the public file URL from the response.
 */
export async function apiUploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const body = await apiFetch<{
    success?: boolean;
    file?: string;
    data?: { file?: string; url?: string } | string;
    url?: string;
  }>("/file-upload", {
    method: "POST",
    body: form,
  });

  const url =
    (typeof body.file === "string" && body.file) ||
    (typeof body.url === "string" && body.url) ||
    (typeof body.data === "string" && body.data) ||
    (body.data &&
      typeof body.data === "object" &&
      (typeof body.data.file === "string"
        ? body.data.file
        : typeof body.data.url === "string"
          ? body.data.url
          : undefined));

  if (!url) {
    throw new ApiError({
      message: "Upload succeeded but no file URL was returned.",
      status: 502,
      code: "INVALID_RESPONSE",
    });
  }
  return url;
}
