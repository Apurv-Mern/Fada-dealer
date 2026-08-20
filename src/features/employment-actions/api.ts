import { apiFetch, isMockMode } from "@/lib/api";
import { mockDelay, normalizeListPayload, unwrapApiData } from "@/lib/api/parse";
import { getOutletOptions } from "@/features/branches/api";
import {
  employmentActionFilterOptions as mockFilterOptions,
  mockEmploymentActions,
} from "@/features/employment-actions/mocks/data";
import {
  computeActionStats,
  type EmploymentAction,
  type EmploymentActionFilterOptions,
  type EmploymentActionListParams,
  type EmploymentActionPageData,
  type EmploymentActionStatus,
} from "@/features/employment-actions/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

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

function nested(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  return asRecord(record[key]);
}

function formatDate(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function mapStatus(raw: string): EmploymentActionStatus {
  const s = raw.toLowerCase();
  if (s.includes("reject")) return "Rejected";
  if (s.includes("accept") || s.includes("verif") || s.includes("approv")) {
    return "Approved";
  }
  if (s.includes("complete") || s.includes("done")) return "Completed";
  if (s.includes("review")) return "In Review";
  return "Pending";
}

/** Map employer invitation → New Join employment action. */
export function mapInvitationToAction(raw: unknown): EmploymentAction {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const outlet = nested(record, "outlet");
  const branch = nested(record, "branch");
  const assignment = nested(record, "assignment");
  const designationObj = nested(record, "designation");
  const nestedDesignation = nested(designationObj, "designation");

  const id =
    readString(record, "id") ||
    readString(record, "assignmentId") ||
    readString(assignment, "id") ||
    String(record.id ?? "");

  const employeeName =
    readString(employee, "name") ||
    readString(record, "employeeName") ||
    readString(record, "name") ||
    "Employee";

  const fadaId =
    readString(employee, "fadaId") ||
    readString(employee, "fadaID") ||
    readString(record, "fadaId") ||
    "—";

  const mobile =
    readString(employee, "phone") ||
    readString(employee, "mobile") ||
    readString(record, "phone") ||
    readString(record, "mobile") ||
    "—";

  const branchName =
    readString(outlet, "name") ||
    readString(branch, "name") ||
    readString(record, "outletName") ||
    readString(record, "branchName") ||
    "—";

  const branchId =
    readString(record, "outletId") ||
    readString(outlet, "id") ||
    readString(branch, "id") ||
    readString(record, "branchId") ||
    "";

  const designation =
    readString(nestedDesignation, "name") ||
    readString(designationObj, "name") ||
    readString(employee, "designation") ||
    readString(record, "designation") ||
    "—";

  const statusRaw =
    readString(record, "status") ||
    readString(assignment, "status") ||
    "pending";
  const status = mapStatus(statusRaw);

  const actionDate = formatDate(
    readString(record, "createdAt") ||
      readString(record, "requestedAt") ||
      readString(record, "invitationSentAt") ||
      readString(record, "updatedAt"),
  );

  const initiatedBy =
    readString(record, "invitationSendBy") ||
    readString(record, "initiatedBy") ||
    readString(record, "createdBy") ||
    "Employee";

  const documentCount =
    readNumber(record, "documentCount") ||
    readNumber(employee, "documentCount") ||
    (Array.isArray(record.documents) ? record.documents.length : 0);

  return {
    id,
    employeeName,
    fadaId,
    mobile,
    actionType: "New Join",
    actionDetails:
      branchName !== "—"
        ? `Join request for ${branchName}`
        : "Join invitation",
    branchId,
    branchName,
    designation,
    actionDate: actionDate || "—",
    initiatedBy: initiatedBy || "—",
    status,
    documentCount,
    source: "invitation",
  };
}

/** Map employer leaving request → Exit employment action. */
export function mapLeavingToAction(raw: unknown): EmploymentAction {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const outlet = nested(record, "outlet");
  const branch = nested(record, "branch");
  const assignment = nested(record, "assignment");
  const designationObj = nested(record, "designation");
  const nestedDesignation = nested(designationObj, "designation");

  const id =
    readString(record, "id") ||
    readString(record, "leavingId") ||
    readString(record, "assignmentId") ||
    readString(assignment, "id") ||
    String(record.id ?? "");

  const employeeName =
    readString(employee, "name") ||
    readString(record, "employeeName") ||
    readString(record, "name") ||
    "Employee";

  const fadaId =
    readString(employee, "fadaId") ||
    readString(employee, "fadaID") ||
    readString(record, "fadaId") ||
    "—";

  const mobile =
    readString(employee, "phone") ||
    readString(employee, "mobile") ||
    readString(record, "phone") ||
    readString(record, "mobile") ||
    "—";

  const branchName =
    readString(outlet, "name") ||
    readString(branch, "name") ||
    readString(record, "outletName") ||
    readString(record, "branchName") ||
    "—";

  const branchId =
    readString(record, "outletId") ||
    readString(outlet, "id") ||
    readString(branch, "id") ||
    readString(record, "branchId") ||
    "";

  const designation =
    readString(nestedDesignation, "name") ||
    readString(designationObj, "name") ||
    readString(employee, "designation") ||
    readString(record, "designation") ||
    "—";

  const statusRaw =
    readString(record, "status") ||
    readString(assignment, "status") ||
    "pending";
  const status = mapStatus(statusRaw);

  const actionDate = formatDate(
    readString(record, "createdAt") ||
      readString(record, "requestedAt") ||
      readString(record, "resignationDate") ||
      readString(record, "lastWorkingDay") ||
      readString(record, "updatedAt"),
  );

  const initiatedBy =
    readString(record, "initiatedBy") ||
    readString(record, "createdBy") ||
    "Employee";

  const documentCount =
    readNumber(record, "documentCount") ||
    readNumber(employee, "documentCount") ||
    (Array.isArray(record.documents) ? record.documents.length : 0);

  return {
    id,
    employeeName,
    fadaId,
    mobile,
    actionType: "Exit",
    actionDetails:
      branchName !== "—"
        ? `Exit request from ${branchName}`
        : "Exit request",
    branchId,
    branchName,
    designation,
    actionDate: actionDate || "—",
    initiatedBy: initiatedBy || "—",
    status,
    documentCount,
    source: "leaving",
  };
}

function extractListItems(body: unknown): unknown[] {
  const unwrapped = (() => {
    try {
      return unwrapApiData(body);
    } catch {
      return body;
    }
  })();

  if (Array.isArray(unwrapped)) return unwrapped;
  if (unwrapped && typeof unwrapped === "object") {
    const record = unwrapped as Record<string, unknown>;
    const keys = [
      "invitations",
      "leaving",
      "leavings",
      "requests",
      "assignments",
      "items",
      "rows",
      "data",
    ];
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }

  return normalizeListPayload(body, { page: 1, pageSize: 500 }).items;
}

function filterAndPaginate(
  rows: EmploymentAction[],
  params: EmploymentActionListParams = {},
): EmploymentActionPageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  const actionType = params.actionType ?? "";
  const status = params.status ?? "";
  const branchId = params.branchId ?? "";
  const from = params.from ?? "";
  const to = params.to ?? "";

  const stats = computeActionStats(rows, to || undefined);

  let filtered = rows;
  if (actionType) {
    filtered = filtered.filter((r) => r.actionType === actionType);
  }
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (branchId) filtered = filtered.filter((r) => r.branchId === branchId);
  if (from) {
    filtered = filtered.filter(
      (r) => r.actionDate !== "—" && r.actionDate >= from,
    );
  }
  if (to) {
    filtered = filtered.filter(
      (r) => r.actionDate !== "—" && r.actionDate <= to,
    );
  }
  if (q) {
    filtered = filtered.filter((r) => {
      const hay =
        `${r.employeeName} ${r.fadaId} ${r.mobile} ${r.actionType} ${r.actionDetails} ${r.branchName} ${r.designation}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    list: { items, total, page, pageSize },
    filteredItems: filtered,
    stats,
    filterOptions: { branches: [] },
  };
}

async function loadAllActions(): Promise<EmploymentAction[]> {
  if (isMockMode()) {
    await mockDelay();
    return mockEmploymentActions.map((r) => ({ ...r }));
  }

  const [invitationsBody, leavingBody] = await Promise.all([
    apiFetch<unknown>("/dealers/employer-invitations"),
    apiFetch<unknown>("/dealers/employer-leaving"),
  ]);

  const joins = extractListItems(invitationsBody)
    .map(mapInvitationToAction)
    .filter((r) => r.id);
  const exits = extractListItems(leavingBody)
    .map(mapLeavingToAction)
    .filter((r) => r.id);

  return [...joins, ...exits];
}

export async function getEmploymentActionsPage(
  params?: EmploymentActionListParams,
): Promise<EmploymentActionPageData> {
  const [rows, filterOptions] = await Promise.all([
    loadAllActions(),
    getEmploymentActionFilterOptions(),
  ]);
  const page = filterAndPaginate(rows, params);
  return { ...page, filterOptions };
}

export async function getEmploymentActionFilterOptions(): Promise<EmploymentActionFilterOptions> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockFilterOptions;
  }

  try {
    const outlets = await getOutletOptions();
    return {
      branches: outlets.map((o) => ({
        label: o.label,
        value: o.value,
      })),
    };
  } catch {
    return { branches: [] };
  }
}

export async function getEmploymentActionDetail(
  action: EmploymentAction,
): Promise<EmploymentAction> {
  if (
    isMockMode() ||
    (action.source !== "invitation" && action.source !== "leaving")
  ) {
    await mockDelay(100);
    return action;
  }

  if (action.source === "leaving") {
    const body = await apiFetch<unknown>(
      `/dealers/employer-leaving/${action.id}`,
    );
    const data = unwrapApiData(body) ?? body;
    return mapLeavingToAction(data);
  }

  const body = await apiFetch<unknown>(
    `/dealers/employer-invitations/${action.id}`,
  );
  const data = unwrapApiData(body) ?? body;
  return mapInvitationToAction(data);
}
