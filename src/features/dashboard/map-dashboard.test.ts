import { describe, expect, it } from "vitest";

import {
  buildDashboardQuery,
  formatDashboardDateRange,
  mapDashboardSummary,
} from "@/features/dashboard/map-dashboard";

const sampleApiBody = {
  success: true,
  message: "Dashboard fetched successfully",
  data: {
    dateRange: { startDate: "2026-07-01", endDate: "2026-07-12" },
    employeeStats: {
      total: { count: 120, changeThisWeek: 3 },
      active: { count: 98, changeThisWeek: 2 },
      newJoins: { count: 5, changeThisWeek: 1 },
      exits: { count: 2, changeThisWeek: 0 },
    },
    employeesByOutlet: [
      {
        outletId: 1,
        outletName: "Sanganer",
        outletCode: "OT583721",
        employeeCount: 45,
      },
      {
        outletId: 2,
        outletName: "Malviya Nagar",
        outletCode: "OT583722",
        employeeCount: 30,
      },
    ],
    pendingRequests: { join: 2, exit: 1, transfer: 0 },
    fadaScoreSummary: {
      statusLabel: "Silver",
      statusColor: "#9CA3AF",
      top25Percent: 18,
      averageScore: 420,
      employeeCount: 98,
    },
    recentEmploymentRequests: [
      {
        id: 10,
        type: "join",
        employeeName: "John Doe",
        status: "pending",
        createdAt: "2026-07-10T14:30:00.000Z",
      },
    ],
  },
};

describe("formatDashboardDateRange", () => {
  it("formats ISO dates for display", () => {
    expect(formatDashboardDateRange("2026-07-01", "2026-07-12")).toBe(
      "01 Jul 2026 - 12 Jul 2026",
    );
  });
});

describe("buildDashboardQuery", () => {
  it("omits empty params", () => {
    expect(buildDashboardQuery({})).toBe("");
  });

  it("includes startDate and endDate when set", () => {
    expect(
      buildDashboardQuery({
        startDate: "2026-07-01",
        endDate: "2026-07-12",
      }),
    ).toBe("?startDate=2026-07-01&endDate=2026-07-12");
  });
});

describe("mapDashboardSummary", () => {
  it("maps the full API payload to DashboardSummary", () => {
    const summary = mapDashboardSummary(sampleApiBody);

    expect(summary.dateRangeLabel).toBe("01 Jul 2026 - 12 Jul 2026");
    expect(summary.startDate).toBe("2026-07-01");
    expect(summary.endDate).toBe("2026-07-12");

    expect(summary.stats.totalEmployees).toEqual({
      label: "Total Employees",
      value: 120,
      weekDelta: 3,
    });
    expect(summary.stats.activeEmployees.value).toBe(98);
    expect(summary.stats.newJoins.weekDelta).toBe(1);
    expect(summary.stats.exits.value).toBe(2);

    expect(summary.employeesByBranch).toHaveLength(2);
    expect(summary.employeesByBranch[0]).toMatchObject({
      label: "Sanganer",
      value: 45,
    });
    expect(summary.employeesByBranchTotal).toBe(75);

    expect(summary.pendingRequests).toEqual({
      total: 3,
      join: 2,
      exit: 1,
      transfer: 0,
    });

    expect(summary.score).toMatchObject({
      status: "Silver",
      statusColor: "#9CA3AF",
      averagePct: 42,
      averageDisplay: "420",
      top25Pct: 18,
      employees: 98,
    });

    expect(summary.recentRequests).toHaveLength(1);
    expect(summary.recentRequests[0]).toMatchObject({
      id: "10",
      employeeName: "John Doe",
      type: "Join",
      status: "Pending",
    });
    expect(summary.recentRequests[0]?.requestedAt).not.toBe("—");
  });

  it("handles empty arrays and missing optional fields", () => {
    const summary = mapDashboardSummary({
      success: true,
      data: {
        dateRange: {},
        employeeStats: {},
        employeesByOutlet: [],
        pendingRequests: {},
        fadaScoreSummary: {},
        recentEmploymentRequests: [],
      },
    });

    expect(summary.dateRangeLabel).toBe("—");
    expect(summary.stats.totalEmployees.value).toBe(0);
    expect(summary.employeesByBranch).toEqual([]);
    expect(summary.employeesByBranchTotal).toBe(0);
    expect(summary.pendingRequests.total).toBe(0);
    expect(summary.score.averagePct).toBeNull();
    expect(summary.score.averageDisplay).toBe("—");
    expect(summary.recentRequests).toEqual([]);
  });
});
