import { ApiError } from "@/lib/api/errors";
import { unwrapApiData } from "@/lib/api/parse";
import { getAccessToken, getActingDealerId } from "@/features/auth/token-store";
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
  /** Skip `x-dealer-id` (e.g. group-dealers list must stay on the logged-in holding). */
  skipDealerHeader?: boolean;
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

function applyAuthHeaders(
  headers: Headers,
  options: Pick<RequestOptions, "skipAuth" | "skipDealerHeader">,
): void {
  const { skipAuth, skipDealerHeader } = options;

  if (!skipAuth && !headers.has("Authorization")) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!skipAuth && !skipDealerHeader && !headers.has("x-dealer-id")) {
    const actingId = getActingDealerId();
    if (actingId) {
      headers.set("x-dealer-id", actingId);
    }
  }
}

function parseContentDispositionFilename(
  header: string | null,
  fallback: string,
): string {
  if (!header) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;\n]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
    } catch {
      return utf8Match[1].replace(/"/g, "");
    }
  }
  const quotedMatch = /filename="([^"]+)"/i.exec(header);
  if (quotedMatch?.[1]) return quotedMatch[1];
  const plainMatch = /filename=([^;\n]+)/i.exec(header);
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/"/g, "");
  return fallback;
}

export type ApiBlobResult = {
  blob: Blob;
  filename: string;
};

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const { skipAuth, skipDealerHeader, body, headers: initHeaders, ...rest } =
    options;
  const headers = new Headers(initHeaders);

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  applyAuthHeaders(headers, { skipAuth, skipDealerHeader });

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
 * Authenticated GET (or other method) that returns a binary file download.
 * Uses the same Bearer + x-dealer-id headers as `apiFetch`.
 */
export async function apiFetchBlob(
  path: string,
  options: RequestOptions = {},
): Promise<ApiBlobResult> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const { skipAuth, skipDealerHeader, body, headers: initHeaders, ...rest } =
    options;
  const headers = new Headers(initHeaders);
  applyAuthHeaders(headers, { skipAuth, skipDealerHeader });

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
    let message = response.statusText || "Download failed";
    let code: string | undefined;
    try {
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        code?: string;
      };
      message = extractErrorMessage(data, message);
      code = data.code;
    } catch {
      // ignore parse errors
    }

    if (!skipAuth && response.status === 401) {
      forceLocalLogout("session");
    }

    throw new ApiError({ message, code, status: response.status });
  }

  const blob = await response.blob();
  const fallback = "download.bin";
  const filename = parseContentDispositionFilename(
    response.headers.get("Content-Disposition"),
    fallback,
  );

  return { blob, filename };
}

/**
 * Upload a file via multipart FormData to Node `POST /file-upload`.
 * Returns the public file URL from the response.
 */
function extractUploadedFileUrl(body: unknown): string | undefined {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;

  const direct =
    (typeof record?.file === "string" && record.file) ||
    (typeof record?.url === "string" && record.url);
  if (direct) return direct;

  try {
    const unwrapped = unwrapApiData(body);
    if (typeof unwrapped === "string" && unwrapped.trim()) return unwrapped;
    if (unwrapped && typeof unwrapped === "object") {
      const data = unwrapped as Record<string, unknown>;
      if (typeof data.file === "string" && data.file.trim()) return data.file;
      if (typeof data.url === "string" && data.url.trim()) return data.url;
    }
  } catch {
    // fall through to undefined
  }

  return undefined;
}

export async function apiUploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const body = await apiFetch<unknown>("/file-upload", {
    method: "POST",
    body: form,
  });

  const url = extractUploadedFileUrl(body);
  if (!url) {
    throw new ApiError({
      message: "Upload succeeded but no file URL was returned.",
      status: 502,
      code: "INVALID_RESPONSE",
    });
  }
  return url;
}
