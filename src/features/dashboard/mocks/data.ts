import type { DashboardSummary } from "@/features/dashboard/types";

export const emptyDashboardSummary: DashboardSummary = {
  dateRangeLabel: "01 Jul 2026 - 12 Jul 2026",
  startDate: "2026-07-01",
  endDate: "2026-07-12",
  stats: {
    totalEmployees: {
      label: "Total Employees",
      value: 0,
      weekDelta: 0,
    },
    activeEmployees: {
      label: "Active Employees",
      value: 0,
      weekDelta: 0,
    },
    newJoins: {
      label: "New Joins",
      value: 0,
      weekDelta: 0,
    },
    exits: {
      label: "Exits",
      value: 0,
      weekDelta: 0,
    },
  },
  employeesByBranch: [],
  employeesByBranchTotal: 0,
  pendingRequests: {
    total: 0,
    join: 0,
    exit: 0,
    transfer: 0,
  },
  score: {
    status: "Needs Work",
    averagePct: null,
    averageDisplay: "—",
    top25Pct: 0,
    employees: 0,
  },
  recentRequests: [],
};
