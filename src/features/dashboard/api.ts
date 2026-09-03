import { apiFetch, isMockMode } from "@/lib/api";
import { mockDelay } from "@/lib/api/parse";
import {
  buildDashboardQuery,
  formatDashboardDateRange,
  mapDashboardSummary,
} from "@/features/dashboard/map-dashboard";
import { emptyDashboardSummary } from "@/features/dashboard/mocks/data";
import type {
  DashboardQueryParams,
  DashboardSummary,
} from "@/features/dashboard/types";

/**
 * Dashboard overview for the dealer portal.
 * Mock mode returns static zeros. Live mode calls GET /dealers/user/dashboard.
 */
export async function getDashboardSummary(
  params: DashboardQueryParams = {},
): Promise<DashboardSummary> {
  if (isMockMode()) {
    await mockDelay();
    const startDate = params.startDate ?? emptyDashboardSummary.startDate;
    const endDate = params.endDate ?? emptyDashboardSummary.endDate;
    return {
      ...emptyDashboardSummary,
      startDate,
      endDate,
      dateRangeLabel: formatDashboardDateRange(startDate, endDate),
    };
  }

  const query = buildDashboardQuery(params);
  const body = await apiFetch<unknown>(`/dealers/user/dashboard${query}`);
  return mapDashboardSummary(body);
}
