import { isMockMode } from "@/lib/api";
import { mockDelay } from "@/lib/api/parse";
import { emptyDashboardSummary } from "@/features/dashboard/mocks/data";
import type { DashboardSummary } from "@/features/dashboard/types";

/**
 * Dashboard overview for the dealer portal.
 * Mock mode returns static zeros. Live HTTP path is not available yet.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (isMockMode()) {
    await mockDelay();
    return emptyDashboardSummary;
  }

  throw new Error(
    "Dashboard API is not available yet. Set NEXT_PUBLIC_USE_MOCKS=true or wait for the Node endpoint.",
  );
}
