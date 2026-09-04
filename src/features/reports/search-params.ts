import type { ReadonlyURLSearchParams } from "next/navigation";

import {
  DEFAULT_REPORT_PAGE_SIZE,
  type DealerReportKey,
  emptyReportUrlQuery,
  isDealerReportKey,
  type ReportUrlQuery,
} from "@/features/reports/types";

export type ParsedReportsQuery = ReportUrlQuery & {
  reportKey: DealerReportKey | "";
};

const FILTER_KEYS = [
  "search",
  "fromDate",
  "toDate",
  "departmentId",
  "designationId",
  "employmentStatus",
  "fadaIdStatus",
  "profileStatus",
  "verificationStatus",
  "membershipStatus",
  "stage",
  "eventType",
] as const satisfies readonly (keyof ReportUrlQuery)[];

export function parseReportsQuery(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): ParsedReportsQuery {
  const keyRaw = searchParams.get("key") ?? "";
  const reportKey = isDealerReportKey(keyRaw) ? keyRaw : ("" as const);
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(
    200,
    Math.max(
      1,
      Number(searchParams.get("pageSize") || String(DEFAULT_REPORT_PAGE_SIZE)) ||
        DEFAULT_REPORT_PAGE_SIZE,
    ),
  );

  const base = emptyReportUrlQuery(pageSize);
  base.page = page;

  for (const key of FILTER_KEYS) {
    base[key] = searchParams.get(key) ?? "";
  }

  return { reportKey, ...base };
}

export function buildReportsSearchParams(
  reportKey: DealerReportKey,
  query: ReportUrlQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("key", reportKey);

  for (const key of FILTER_KEYS) {
    const value = query[key];
    if (value) params.set(key, value);
  }

  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_REPORT_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }

  return params;
}

export function reportsResourceKey(
  reportKey: DealerReportKey | "",
  query: ReportUrlQuery,
): string {
  return [
    reportKey,
    query.search,
    query.fromDate,
    query.toDate,
    query.departmentId,
    query.designationId,
    query.employmentStatus,
    query.fadaIdStatus,
    query.profileStatus,
    query.verificationStatus,
    query.membershipStatus,
    query.stage,
    query.eventType,
    query.page,
    query.pageSize,
  ].join("|");
}
