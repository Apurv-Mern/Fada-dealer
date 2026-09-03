import type { DonutSlice } from "@/components/ui";

export type DashboardStat = {
  label: string;
  value: number;
  weekDelta: number;
};

export type DashboardStats = {
  totalEmployees: DashboardStat;
  activeEmployees: DashboardStat;
  newJoins: DashboardStat;
  exits: DashboardStat;
};

export type PendingRequestCounts = {
  total: number;
  join: number;
  exit: number;
  transfer: number;
};

export type FadaScoreSummary = {
  status: string;
  /** API tier color (hex) when provided. */
  statusColor?: string;
  /** 0–100 marker position; null when unknown. */
  averagePct: number | null;
  /** Display string for average score (e.g. "—" when null). */
  averageDisplay: string;
  top25Pct: number;
  employees: number;
};

export type DashboardQueryParams = {
  startDate?: string;
  endDate?: string;
};

export type EmploymentRequestType = "Join" | "Exit" | "Transfer";
export type EmploymentRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "In Review";

export type RecentEmploymentRequest = {
  id: string;
  employeeName: string;
  type: EmploymentRequestType;
  requestedAt: string;
  status: EmploymentRequestStatus;
};

export type DashboardSummary = {
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  stats: DashboardStats;
  employeesByBranch: DonutSlice[];
  employeesByBranchTotal: number;
  pendingRequests: PendingRequestCounts;
  score: FadaScoreSummary;
  recentRequests: RecentEmploymentRequest[];
};
