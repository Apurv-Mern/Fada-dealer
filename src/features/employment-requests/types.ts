export type EmploymentRequestKind = "Join" | "Exit";

/** URL / tab filter; empty string means All. */
export type EmploymentRequestTypeFilter = EmploymentRequestKind | "";

export type EmploymentRequestStatus =
  | "Pending"
  | "Accepted"
  | "Approved"
  | "Rejected"
  | "In Review";

export const LEAVING_WORKFLOW_STATUSES = [
  "handover_completed",
  "clearance_completed",
  "exit_completed",
] as const;

export type LeavingWorkflowStatus = (typeof LEAVING_WORKFLOW_STATUSES)[number];

export const JOIN_WORKFLOW_STATUSES = [
  "share_details",
  "employer_verification",
  "joining_confirmed",
] as const;

export type JoinWorkflowStatus = (typeof JOIN_WORKFLOW_STATUSES)[number];

export type { LeavingExitStatus } from "@/features/employment-requests/leaving-steps";
export type { JoinInvitationStatus } from "@/features/employment-requests/joining-steps";

export type LeavingStep = {
  id: string;
  status: string;
  title: string;
  description: string;
};

export type LeavingHistoryItem = {
  id: string;
  status: string;
  createdAt?: string;
  /** Who performed this status update: dealer | employee | admin. */
  actionUserBy?: string;
  /** Display name of the actor when available. */
  actionUserName?: string;
};

export type EmploymentRequest = {
  id: string;
  employeeName: string;
  fadaId: string;
  requestType: EmploymentRequestKind;
  /** Display line for FROM / TO column (e.g. branch name or "A → B"). */
  fromTo: string;
  branchId: string;
  branchName: string;
  requestedAt: string;
  status: EmploymentRequestStatus;
  /** Pending Join or Exit requests can be accepted/rejected via API. */
  canDecide: boolean;
  /** Accepted requests can advance workflow steps. */
  canAdvanceWorkflow?: boolean;
  completedSteps?: string[];
  departmentName?: string;
  designationName?: string;
  mobile?: string;
  resignationDate?: string;
  lastWorkingDay?: string;
  reason?: string;
  /** Full local date-time for popup display (listing uses date-only `requestedAt`). */
  requestedAtDateTime?: string;
  /** Latest accept_invitation / accept_resignation timestamp (popup). */
  acceptedAt?: string;
  /** Latest reject_invitation timestamp (popup). */
  rejectedAt?: string;
};

export type LeavingDetail = EmploymentRequest & {
  history: LeavingHistoryItem[];
};

export type InvitationDetail = EmploymentRequest & {
  history: LeavingHistoryItem[];
  /** Whether send_invitation was performed by the dealer. */
  sendInvitationByDealer?: boolean;
  /** Display name for who sent/received the invitation. */
  sendInvitationActorName?: string;
};

export type EmploymentRequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingPct: number;
  approvedPct: number;
  rejectedPct: number;
};

export type EmploymentRequestTypeCounts = {
  all: number;
  join: number;
  exit: number;
};

export type EmploymentRequestFilterOptions = {
  branches: { label: string; value: string }[];
};

export type EmployerInvitationSendInput = {
  employeeId: string;
  outletId: string;
  departmentId: string;
  designationId: string;
};

export type EmploymentRequestListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  type?: EmploymentRequestTypeFilter;
  status?: EmploymentRequestStatus | "";
  branchId?: string;
};

export type EmploymentRequestPageData = {
  list: {
    items: EmploymentRequest[];
    total: number;
    page: number;
    pageSize: number;
  };
  /** All rows matching filters (for export), not paginated. */
  filteredItems: EmploymentRequest[];
  stats: EmploymentRequestStats;
  typeCounts: EmploymentRequestTypeCounts;
  filterOptions: EmploymentRequestFilterOptions;
};

export function parseRequestType(
  value: string | null | undefined,
): EmploymentRequestTypeFilter {
  if (value === "Join" || value === "Exit") return value;
  return "";
}

export function parseRequestStatus(
  value: string | null | undefined,
): EmploymentRequestStatus | "" {
  if (
    value === "Pending" ||
    value === "Accepted" ||
    value === "Approved" ||
    value === "Rejected" ||
    value === "In Review"
  ) {
    return value;
  }
  return "";
}

export function isLeavingWorkflowStatus(
  value: string,
): value is LeavingWorkflowStatus {
  return (LEAVING_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function isJoinWorkflowStatus(
  value: string,
): value is JoinWorkflowStatus {
  return (JOIN_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function nextLeavingWorkflowStatus(
  completedSteps: string[] = [],
): LeavingWorkflowStatus | null {
  return (
    LEAVING_WORKFLOW_STATUSES.find((step) => !completedSteps.includes(step)) ??
    null
  );
}

export function computeStats(
  rows: EmploymentRequest[],
): EmploymentRequestStats {
  const total = rows.length;
  const pending = rows.filter((r) => r.status === "Pending").length;
  const approved = rows.filter((r) => r.status === "Approved").length;
  const rejected = rows.filter((r) => r.status === "Rejected").length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);
  return {
    total,
    pending,
    approved,
    rejected,
    pendingPct: pct(pending),
    approvedPct: pct(approved),
    rejectedPct: pct(rejected),
  };
}

export function computeTypeCounts(
  rows: EmploymentRequest[],
): EmploymentRequestTypeCounts {
  return {
    all: rows.length,
    join: rows.filter((r) => r.requestType === "Join").length,
    exit: rows.filter((r) => r.requestType === "Exit").length,
  };
}
