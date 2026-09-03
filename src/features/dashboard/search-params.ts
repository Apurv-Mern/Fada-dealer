import type { ReadonlyURLSearchParams } from "next/navigation";

import type { DashboardQueryParams } from "@/features/dashboard/types";

export type ParsedDashboardQuery = {
  startDate: string;
  endDate: string;
};

export function emptyDashboardQuery(): ParsedDashboardQuery {
  return { startDate: "", endDate: "" };
}

export function parseDashboardQuery(
  searchParams: ReadonlyURLSearchParams | URLSearchParams,
): ParsedDashboardQuery {
  return {
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
  };
}

export function buildDashboardSearchParams(
  query: ParsedDashboardQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  if (query.startDate) params.set("startDate", query.startDate);
  if (query.endDate) params.set("endDate", query.endDate);
  return params;
}

export function dashboardQueryToApiParams(
  query: ParsedDashboardQuery,
): DashboardQueryParams {
  return {
    startDate: query.startDate || undefined,
    endDate: query.endDate || undefined,
  };
}

export function dashboardResourceKey(query: ParsedDashboardQuery): string {
  return [query.startDate, query.endDate].join("|");
}
