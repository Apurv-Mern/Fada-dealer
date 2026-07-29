import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import type { ListResult } from "@/types/api";

/** Artificial latency for mock handlers only. */
export function mockDelay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Build a query string from defined string/number/boolean values (Node path stays unprefixed). */
export function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Unwrap `{ success, data }` (or pass-through when `data` is absent).
 * Throws ApiError when the envelope is unusable.
 */
export function unwrapApiData<T = unknown>(body: unknown): T {
  if (body === null || body === undefined) {
    throw new ApiError({
      message: "Unexpected empty response from the server.",
      status: 502,
      code: "INVALID_RESPONSE",
    });
  }
  if (typeof body !== "object") return body as T;
  const record = body as Record<string, unknown>;
  if ("data" in record) return record.data as T;
  return body as T;
}

/**
 * Normalize common Node list envelopes into `{ items, total }`.
 * Accepts bare arrays or objects with list keys + optional `pagination.total`.
 */
export function normalizeListPayload(
  body: unknown,
  fallback: { page: number; pageSize: number },
): { items: unknown[]; total: number; page: number; pageSize: number } {
  const unwrapped = unwrapApiData(body);
  let items: unknown[] = [];
  let total: number | undefined;
  let page = fallback.page;
  let pageSize = fallback.pageSize;

  if (Array.isArray(unwrapped)) {
    items = unwrapped;
  } else if (unwrapped && typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    if (Array.isArray(record.items)) items = record.items;
    else if (Array.isArray(record.outlets)) items = record.outlets;
    else if (Array.isArray(record.employees)) items = record.employees;
    else if (Array.isArray(record.contacts)) items = record.contacts;
    else if (Array.isArray(record.rows)) items = record.rows;
    else if (Array.isArray(record.data)) items = record.data;
    else if (Array.isArray(record.results)) items = record.results;

    if (typeof record.total === "number") total = record.total;
    else if (typeof record.count === "number") total = record.count;

    const pagination = record.pagination;
    if (pagination && typeof pagination === "object") {
      const pageInfo = pagination as Record<string, unknown>;
      if (typeof pageInfo.total === "number") total = pageInfo.total;
      if (typeof pageInfo.limit === "number" && pageInfo.limit > 0) {
        pageSize = pageInfo.limit;
        if (typeof pageInfo.offset === "number" && pageInfo.offset >= 0) {
          page = Math.floor(pageInfo.offset / pageInfo.limit) + 1;
        }
      }
    }
  }

  // Some APIs put total on the outer envelope.
  if (total === undefined && body && typeof body === "object") {
    const outer = body as Record<string, unknown>;
    if (typeof outer.total === "number") total = outer.total;
    else if (typeof outer.count === "number") total = outer.count;
  }

  return {
    items,
    total: total ?? items.length,
    page,
    pageSize,
  };
}

export function listResultSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
}

/**
 * Parse a list payload. Throws ApiError on contract drift (never soft-empties).
 */
export function parseListResult<T>(
  data: unknown,
  itemSchema: z.ZodType<T>,
  fallback?: { page?: number; pageSize?: number },
): ListResult<T> {
  const schema = z.object({
    items: z.array(itemSchema),
    total: z.number().optional(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
  });

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected response shape from the server.",
      status: 502,
      code: "INVALID_RESPONSE",
    });
  }

  return {
    items: parsed.data.items,
    total: parsed.data.total ?? parsed.data.items.length,
    page: parsed.data.page ?? fallback?.page ?? 1,
    pageSize: parsed.data.pageSize ?? fallback?.pageSize ?? 10,
  };
}

/** Parse with a Zod schema; throw ApiError on failure. */
export function parseWithSchema<T>(data: unknown, schema: z.ZodType<T>): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Unexpected response shape from the server.",
      status: 502,
      code: "INVALID_RESPONSE",
    });
  }
  return parsed.data;
}
