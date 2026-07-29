import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status ?? 500;
    this.code = body.code;
  }
}

export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/** User-facing copy for section load failures (not for 401 — logout handles that). */
export function messageFromApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) {
      return "This section's API is not available yet.";
    }
    if (err.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (err.message.trim()) return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return "Couldn't reach the server. Check your connection and try again.";
}
