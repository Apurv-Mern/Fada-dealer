import { formatDisplayDate } from "@/features/employment-actions/types";
import { formatDateTime } from "@/features/employment-requests/api";
import type {
  DashboardSummary,
  EmploymentRequestStatus,
  EmploymentRequestType,
  RecentEmploymentRequest,
} from "@/features/dashboard/types";
import { buildQuery, unwrapApiData } from "@/lib/api/parse";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const FADA_SCORE_MAX = 1000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return 0;
}

function readStat(record: Record<string, unknown>, label: string) {
  const nested = asRecord(record);
  return {
    label,
    value: readNumber(nested, "count"),
    weekDelta: readNumber(nested, "changeThisWeek"),
  };
}

export function formatDashboardDateRange(startDate: string, endDate: string): string {
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  }
  if (startDate) return formatDisplayDate(startDate);
  if (endDate) return formatDisplayDate(endDate);
  return "—";
}

export function buildDashboardQuery(params: {
  startDate?: string;
  endDate?: string;
}): string {
  return buildQuery({
    startDate: params.startDate,
    endDate: params.endDate,
  });
}

function mapRequestType(raw: string): EmploymentRequestType {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "exit") return "Exit";
  if (normalized === "transfer") return "Transfer";
  return "Join";
}

function mapRequestStatus(raw: string): EmploymentRequestStatus {
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("reject")) return "Rejected";
  if (normalized.includes("approv")) return "Approved";
  if (normalized.includes("review")) return "In Review";
  return "Pending";
}

function mapRecentRequest(raw: unknown): RecentEmploymentRequest | null {
  const record = asRecord(raw);
  const id = readString(record, "id");
  const employeeName = readString(record, "employeeName");
  if (!id && !employeeName) return null;

  return {
    id: id || employeeName,
    employeeName: employeeName || "—",
    type: mapRequestType(readString(record, "type")),
    requestedAt: formatDateTime(readString(record, "createdAt")),
    status: mapRequestStatus(readString(record, "status")),
  };
}

export function mapDashboardSummary(body: unknown): DashboardSummary {
  const data = asRecord(unwrapApiData(body));
  const dateRange = asRecord(data.dateRange);
  const startDate = readString(dateRange, "startDate");
  const endDate = readString(dateRange, "endDate");

  const employeeStats = asRecord(data.employeeStats);
  const pending = asRecord(data.pendingRequests);
  const join = readNumber(pending, "join");
  const exit = readNumber(pending, "exit");
  const transfer = readNumber(pending, "transfer");

  const scoreRaw = asRecord(data.fadaScoreSummary);
  const averageScore = readNumber(scoreRaw, "averageScore");
  const averagePct =
    averageScore > 0
      ? Math.min(100, Math.max(0, Math.round((averageScore / FADA_SCORE_MAX) * 100)))
      : null;

  const outlets = Array.isArray(data.employeesByOutlet) ? data.employeesByOutlet : [];
  const employeesByBranch = outlets.map((item, index) => {
    const record = asRecord(item);
    return {
      label: readString(record, "outletName") || readString(record, "outletCode") || "Outlet",
      value: Math.max(0, readNumber(record, "employeeCount")),
      color: CHART_COLORS[index % CHART_COLORS.length]!,
    };
  });
  const employeesByBranchTotal = employeesByBranch.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );

  const recentRaw = Array.isArray(data.recentEmploymentRequests)
    ? data.recentEmploymentRequests
    : [];

  return {
    dateRangeLabel: formatDashboardDateRange(startDate, endDate),
    startDate,
    endDate,
    stats: {
      totalEmployees: readStat(asRecord(employeeStats.total), "Total Employees"),
      activeEmployees: readStat(asRecord(employeeStats.active), "Active Employees"),
      newJoins: readStat(asRecord(employeeStats.newJoins), "New Joins"),
      exits: readStat(asRecord(employeeStats.exits), "Exits"),
    },
    employeesByBranch,
    employeesByBranchTotal,
    pendingRequests: {
      total: join + exit + transfer,
      join,
      exit,
      transfer,
    },
    score: {
      status: readString(scoreRaw, "statusLabel") || "—",
      statusColor: readString(scoreRaw, "statusColor") || undefined,
      averagePct,
      averageDisplay: averageScore > 0 ? String(averageScore) : "—",
      top25Pct: readNumber(scoreRaw, "top25Percent"),
      employees: readNumber(scoreRaw, "employeeCount"),
    },
    recentRequests: recentRaw
      .map(mapRecentRequest)
      .filter((item): item is RecentEmploymentRequest => item != null),
  };
}
