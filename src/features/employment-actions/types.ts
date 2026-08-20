export type EmploymentActionType =
  | "New Join"
  | "Transfer"
  | "Exit"
  | "Other";

export type EmploymentActionTypeFilter = EmploymentActionType | "";

export type EmploymentActionStatus =
  | "Pending"
  | "Completed"
  | "Approved"
  | "Rejected"
  | "In Review";

export type EmploymentAction = {
  id: string;
  employeeName: string;
  fadaId: string;
  mobile: string;
  actionType: EmploymentActionType;
  actionDetails: string;
  branchId: string;
  branchName: string;
  designation: string;
  actionDate: string;
  initiatedBy: string;
  status: EmploymentActionStatus;
  documentCount: number;
  /** Join/exit rows can load matching detail. */
  source: "invitation" | "leaving" | "mock";
};

export type EmploymentActionStats = {
  totalThisMonth: number;
  vsLastMonthPct: number;
  newJoins: number;
  newJoinsPct: number;
  transfers: number;
  transfersPct: number;
  exits: number;
  exitsPct: number;
  other: number;
  otherPct: number;
};

export type EmploymentActionFilterOptions = {
  branches: { label: string; value: string }[];
};

export type EmploymentActionListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  actionType?: EmploymentActionTypeFilter;
  status?: EmploymentActionStatus | "";
  branchId?: string;
  from?: string;
  to?: string;
};

export type EmploymentActionPageData = {
  list: {
    items: EmploymentAction[];
    total: number;
    page: number;
    pageSize: number;
  };
  filteredItems: EmploymentAction[];
  stats: EmploymentActionStats;
  filterOptions: EmploymentActionFilterOptions;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format YYYY-MM-DD → "01 Jul 2024". */
export function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function startOfMonthIso(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return toIsoDate(d);
}

export function todayIso(date = new Date()): string {
  return toIsoDate(date);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseActionType(
  value: string | null | undefined,
): EmploymentActionTypeFilter {
  if (
    value === "New Join" ||
    value === "Transfer" ||
    value === "Exit" ||
    value === "Other"
  ) {
    return value;
  }
  return "";
}

export function parseActionStatus(
  value: string | null | undefined,
): EmploymentActionStatus | "" {
  if (
    value === "Pending" ||
    value === "Completed" ||
    value === "Approved" ||
    value === "Rejected" ||
    value === "In Review"
  ) {
    return value;
  }
  return "";
}

function pctOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

function momPct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

function inMonth(isoDate: string, year: number, monthIndex: number): boolean {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === year && d.getMonth() === monthIndex;
}

export function computeActionStats(
  rows: EmploymentAction[],
  referenceIso?: string,
): EmploymentActionStats {
  const ref = referenceIso
    ? new Date(`${referenceIso}T00:00:00`)
    : new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;

  const thisMonth = rows.filter((r) => inMonth(r.actionDate, year, month));
  const lastMonth = rows.filter((r) =>
    inMonth(r.actionDate, prevYear, prevMonth),
  );

  const totalThisMonth = thisMonth.length;
  const newJoins = thisMonth.filter((r) => r.actionType === "New Join").length;
  const transfers = thisMonth.filter((r) => r.actionType === "Transfer").length;
  const exits = thisMonth.filter((r) => r.actionType === "Exit").length;
  const other = thisMonth.filter((r) => r.actionType === "Other").length;

  return {
    totalThisMonth,
    vsLastMonthPct: momPct(totalThisMonth, lastMonth.length),
    newJoins,
    newJoinsPct: pctOf(newJoins, totalThisMonth),
    transfers,
    transfersPct: pctOf(transfers, totalThisMonth),
    exits,
    exitsPct: pctOf(exits, totalThisMonth),
    other,
    otherPct: pctOf(other, totalThisMonth),
  };
}
