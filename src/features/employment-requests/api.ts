import { apiFetch, isMockMode } from "@/lib/api";
import { mockDelay, normalizeListPayload, unwrapApiData } from "@/lib/api/parse";
import { ApiError } from "@/lib/api/errors";
import { getOutletOptions } from "@/features/branches/api";
import {
  advanceMockInvitationStatus,
  advanceMockLeavingStatus,
  addMockJoinInvitation,
  employmentRequestFilterOptions as mockFilterOptions,
  getMockInvitationDetail,
  getMockLeavingDetail,
  mockEmploymentRequests,
  mockInvitationSteps,
  mockLeavingSteps,
  updateMockRequestStatus,
} from "@/features/employment-requests/mocks/data";
import {
  computeStats,
  computeTypeCounts,
  isJoinWorkflowStatus,
  isLeavingWorkflowStatus,
  type EmployerInvitationSendInput,
  type EmploymentRequest,
  type EmploymentRequestFilterOptions,
  type EmploymentRequestListParams,
  type EmploymentRequestPageData,
  type EmploymentRequestStatus,
  type EmploymentRequestTypeCounts,
  type EmploymentRequestTypeFilter,
  type InvitationDetail,
  type LeavingDetail,
  type LeavingHistoryItem,
  type LeavingStep,
} from "@/features/employment-requests/types";

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

function nested(record: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(record[key]);
}

function formatDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().slice(0, 10);
}

import {
  collectCompletedLeavingSteps,
  nextLeavingExitStatus,
  normalizeLeavingStepStatus,
  type LeavingExitStatus,
} from "@/features/employment-requests/leaving-steps";
import {
  collectCompletedJoinSteps,
  isJoinInvitationStatus,
  nextJoinInvitationStatus,
  normalizeJoinStepStatus,
  type JoinInvitationStatus,
} from "@/features/employment-requests/joining-steps";

export {
  collectCompletedJoinSteps,
  collectCompletedLeavingSteps,
  nextJoinInvitationStatus,
  nextLeavingExitStatus,
  normalizeJoinStepStatus,
  normalizeLeavingStepStatus,
  type JoinInvitationStatus,
  type LeavingExitStatus,
};

function mapLeavingStatus(
  raw: string,
  completedSteps: string[],
): EmploymentRequestStatus {
  const s = raw.toLowerCase();
  if (s.includes("reject")) return "Rejected";
  if (completedSteps.includes("exit_completed") || s.includes("exit_completed")) {
    return "Approved";
  }
  if (s.includes("accept")) return "Accepted";
  if (s.includes("verif") || s.includes("approv")) return "Approved";
  if (
    completedSteps.some((step) => isLeavingWorkflowStatus(step)) ||
    s.includes("handover") ||
    s.includes("clearance") ||
    s.includes("review")
  ) {
    return "In Review";
  }
  return "Pending";
}

function mapInvitationStatus(
  raw: string,
  completedSteps: string[],
): EmploymentRequestStatus {
  const s = raw.toLowerCase();
  if (s.includes("reject")) return "Rejected";
  if (
    completedSteps.includes("joining_confirmed") ||
    s.includes("joining_confirmed")
  ) {
    return "Approved";
  }
  if (
    completedSteps.some((step) => isJoinWorkflowStatus(step)) ||
    completedSteps.some((step) => isJoinInvitationStatus(step)) ||
    s.includes("share") ||
    s.includes("review")
  ) {
    return "In Review";
  }
  if (s.includes("accept") && !s.includes("invitation")) return "Accepted";
  if (s.includes("verif") || s.includes("approv")) return "Approved";
  return "Pending";
}

function mapInvitationRecord(raw: unknown): EmploymentRequest {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const outlet = nested(record, "outlet");
  const branch = nested(record, "branch");
  const assignment = nested(record, "assignment");
  const departmentObj = nested(record, "department");
  const designationObj = nested(record, "designation");
  const nestedDesignation = nested(designationObj, "designation");
  const completedSteps = collectCompletedJoinSteps(raw);

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
    readString(record, "fadaID") ||
    "—";

  const mobile =
    readString(employee, "phone") ||
    readString(employee, "mobile") ||
    readString(record, "phone") ||
    readString(record, "mobile") ||
    undefined;

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

  const departmentName =
    readString(departmentObj, "name") ||
    readString(record, "departmentName") ||
    undefined;

  const designationName =
    readString(nestedDesignation, "name") ||
    readString(designationObj, "name") ||
    readString(record, "designationName") ||
    undefined;

  const statusRaw =
    readString(record, "status") ||
    readString(assignment, "status") ||
    "pending";
  const status = mapInvitationStatus(statusRaw, completedSteps);

  const requestedAt = formatDate(
    readString(record, "createdAt") ||
      readString(record, "requestedAt") ||
      readString(record, "invitationSentAt") ||
      readString(record, "updatedAt"),
  );

  return {
    id,
    employeeName,
    fadaId,
    requestType: "Join",
    fromTo: branchName,
    branchId,
    branchName,
    requestedAt,
    status,
    canDecide: status === "Pending",
    canAdvanceWorkflow:
      status !== "Rejected" &&
      status !== "Approved" &&
      nextJoinInvitationStatus(completedSteps) !== null,
    completedSteps,
    departmentName,
    designationName,
    mobile,
  };
}

/** Defensive mapper — Swagger has no list item schema. */
export function mapApiInvitation(raw: unknown): EmploymentRequest {
  return mapInvitationRecord(raw);
}

function mapLeavingRecord(raw: unknown): EmploymentRequest {
  const record = asRecord(raw);
  const employee = nested(record, "employee");
  const outlet = nested(record, "outlet");
  const branch = nested(record, "branch");
  const assignment = nested(record, "assignment");
  const completedSteps = collectCompletedLeavingSteps(raw);

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
    readString(record, "fadaID") ||
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

  const statusRaw =
    readString(record, "status") ||
    readString(assignment, "status") ||
    "pending";
  const status = mapLeavingStatus(statusRaw, completedSteps);

  const requestedAt = formatDate(
    readString(record, "createdAt") ||
      readString(record, "requestedAt") ||
      readString(record, "resignationDate") ||
      readString(record, "lastWorkingDay") ||
      readString(record, "updatedAt"),
  );

  const resignationDate =
    formatDate(
      readString(record, "resignationDate") ||
        readString(record, "resignDate"),
    ) || undefined;
  const lastWorkingDay =
    formatDate(
      readString(record, "lastWorkingDay") ||
        readString(record, "lastWorkingDate"),
    ) || undefined;
  const reason =
    readString(record, "reason") ||
    readString(record, "remarks") ||
    undefined;

  return {
    id,
    employeeName,
    fadaId,
    requestType: "Exit",
    fromTo: branchName,
    branchId,
    branchName,
    requestedAt,
    status,
    canDecide: status === "Pending",
    canAdvanceWorkflow:
      status !== "Rejected" &&
      status !== "Approved" &&
      nextLeavingExitStatus(completedSteps) !== null,
    completedSteps,
    resignationDate: resignationDate === "—" ? undefined : resignationDate,
    lastWorkingDay: lastWorkingDay === "—" ? undefined : lastWorkingDay,
    reason: reason || undefined,
  };
}

/** Defensive mapper — Swagger has no leaving list item schema. */
export function mapApiLeaving(raw: unknown): EmploymentRequest {
  return mapLeavingRecord(raw);
}

export function mapLeavingHistory(raw: unknown): LeavingHistoryItem[] {
  const record = asRecord(raw);
  const keys = [
    "history",
    "statusHistory",
    "statuses",
    "leavingStatuses",
    "employeeEmployerStatus",
  ];
  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    return value.map((item, index) => {
      const row = asRecord(item);
      return {
        id:
          readString(row, "id") ||
          `${readString(row, "status") || "step"}-${index}`,
        status:
          readString(row, "status") ||
          readString(row, "slug") ||
          "updated",
        createdAt:
          readString(row, "createdAt") ||
          readString(row, "updatedAt") ||
          undefined,
      };
    });
  }
  return [];
}

export function mapLeavingDetail(raw: unknown): LeavingDetail {
  return {
    ...mapLeavingRecord(raw),
    history: mapLeavingHistory(raw),
  };
}

export function mapInvitationDetail(raw: unknown): InvitationDetail {
  return {
    ...mapInvitationRecord(raw),
    history: mapLeavingHistory(raw),
  };
}

export function mapInvitationSteps(raw: unknown): LeavingStep[] {
  const unwrapped = (() => {
    try {
      return unwrapApiData(raw);
    } catch {
      return raw;
    }
  })();

  const rows = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(asRecord(unwrapped).data)
      ? (asRecord(unwrapped).data as unknown[])
      : Array.isArray(asRecord(unwrapped).items)
        ? (asRecord(unwrapped).items as unknown[])
        : [];

  const mapped = rows
    .map((item, index) => {
      const row = asRecord(item);
      const status = normalizeJoinStepStatus(
        readString(row, "status") || readString(row, "slug"),
      );
      if (!status) return null;
      return {
        id: readString(row, "id") || String(index + 1),
        status,
        title:
          readString(row, "title") ||
          status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: readString(row, "description"),
      } satisfies LeavingStep;
    })
    .filter((item): item is LeavingStep => item != null);

  return mapped.length > 0 ? mapped : mockInvitationSteps;
}

export function mapLeavingSteps(raw: unknown): LeavingStep[] {
  const unwrapped = (() => {
    try {
      return unwrapApiData(raw);
    } catch {
      return raw;
    }
  })();

  const rows = Array.isArray(unwrapped)
    ? unwrapped
    : Array.isArray(asRecord(unwrapped).data)
      ? (asRecord(unwrapped).data as unknown[])
      : Array.isArray(asRecord(unwrapped).items)
        ? (asRecord(unwrapped).items as unknown[])
        : [];

  const mapped = rows
    .map((item, index) => {
      const row = asRecord(item);
      const status = normalizeLeavingStepStatus(
        readString(row, "status") || readString(row, "slug"),
      );
      if (!status) return null;
      return {
        id: readString(row, "id") || String(index + 1),
        status,
        title:
          readString(row, "title") ||
          status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: readString(row, "description"),
      } satisfies LeavingStep;
    })
    .filter((item): item is LeavingStep => item != null);

  return mapped.length > 0 ? mapped : mockLeavingSteps;
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
  rows: EmploymentRequest[],
  params: EmploymentRequestListParams = {},
  typeCounts: EmploymentRequestTypeCounts = computeTypeCounts(rows),
): EmploymentRequestPageData {
  const page = Math.max(1, params.page ?? DEFAULT_PAGE);
  const pageSize = Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE);
  const q = (params.q ?? "").trim().toLowerCase();
  const type = params.type ?? "";
  const status = params.status ?? "";
  const branchId = params.branchId ?? "";

  const scopedForStats = type
    ? rows.filter((r) => r.requestType === type)
    : rows;
  const stats = computeStats(scopedForStats);

  let filtered = rows;
  if (type) filtered = filtered.filter((r) => r.requestType === type);
  if (status) filtered = filtered.filter((r) => r.status === status);
  if (branchId) filtered = filtered.filter((r) => r.branchId === branchId);
  if (q) {
    filtered = filtered.filter((r) => {
      const hay = `${r.employeeName} ${r.fadaId} ${r.requestType} ${r.fromTo} ${r.branchName}`.toLowerCase();
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
    typeCounts,
    filterOptions: { branches: [] },
  };
}

type EmploymentRequestsListCache = {
  join: EmploymentRequest[] | null;
  exit: EmploymentRequest[] | null;
};

let employmentRequestsListCache: EmploymentRequestsListCache = {
  join: null,
  exit: null,
};

function cloneEmploymentRequests(rows: EmploymentRequest[]): EmploymentRequest[] {
  return rows.map((row) => ({
    ...row,
    completedSteps: row.completedSteps ? [...row.completedSteps] : undefined,
  }));
}

function updateListCache(kind: "join" | "exit", rows: EmploymentRequest[]): void {
  employmentRequestsListCache[kind] = cloneEmploymentRequests(rows);
}

export function clearEmploymentRequestsListCache(): void {
  employmentRequestsListCache = { join: null, exit: null };
}

function getTypeCountsFromCache(): EmploymentRequestTypeCounts {
  const join = employmentRequestsListCache.join ?? [];
  const exit = employmentRequestsListCache.exit ?? [];
  return computeTypeCounts([...join, ...exit]);
}

async function loadJoinRequests(): Promise<EmploymentRequest[]> {
  if (isMockMode()) {
    await mockDelay();
    const rows = mockEmploymentRequests
      .filter((row) => row.requestType === "Join")
      .map((row) => ({
        ...row,
        completedSteps: row.completedSteps ? [...row.completedSteps] : undefined,
      }));
    updateListCache("join", rows);
    return rows;
  }

  const invitationsBody = await apiFetch<unknown>("/dealers/employer-invitations");
  const rows = extractListItems(invitationsBody)
    .map(mapApiInvitation)
    .filter((row) => row.id);
  updateListCache("join", rows);
  return rows;
}

async function loadExitRequests(): Promise<EmploymentRequest[]> {
  if (isMockMode()) {
    await mockDelay();
    const rows = mockEmploymentRequests
      .filter((row) => row.requestType === "Exit")
      .map((row) => ({
        ...row,
        completedSteps: row.completedSteps ? [...row.completedSteps] : undefined,
      }));
    updateListCache("exit", rows);
    return rows;
  }

  const leavingBody = await apiFetch<unknown>("/dealers/employer-leaving");
  const rows = extractListItems(leavingBody)
    .map(mapApiLeaving)
    .filter((row) => row.id);
  updateListCache("exit", rows);
  return rows;
}

async function loadRequestsForType(
  type: EmploymentRequestTypeFilter = "",
): Promise<EmploymentRequest[]> {
  if (type === "Join") {
    return loadJoinRequests();
  }
  if (type === "Exit") {
    return loadExitRequests();
  }

  const [joins, exits] = await Promise.all([
    loadJoinRequests(),
    loadExitRequests(),
  ]);
  return [...joins, ...exits];
}

export async function getEmploymentRequestsPage(
  params?: EmploymentRequestListParams,
): Promise<EmploymentRequestPageData> {
  const type = params?.type ?? "";
  const [rows, filterOptions] = await Promise.all([
    loadRequestsForType(type),
    getEmploymentRequestFilterOptions(),
  ]);
  const page = filterAndPaginate(rows, params, getTypeCountsFromCache());
  return { ...page, filterOptions };
}

export async function getEmploymentRequestFilterOptions(): Promise<EmploymentRequestFilterOptions> {
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

export async function getLeavingDetail(id: string): Promise<LeavingDetail> {
  if (isMockMode()) {
    await mockDelay(120);
    return getMockLeavingDetail(id);
  }

  const body = await apiFetch<unknown>(`/dealers/employer-leaving/${id}`);
  return mapLeavingDetail(unwrapApiData(body) ?? body);
}

export async function getLeavingSteps(): Promise<LeavingStep[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockLeavingSteps.map((step) => ({ ...step }));
  }

  const body = await apiFetch<unknown>("/dealers/employer-leaving/steps");
  return mapLeavingSteps(body);
}

export async function getInvitationDetail(id: string): Promise<InvitationDetail> {
  if (isMockMode()) {
    await mockDelay(120);
    return getMockInvitationDetail(id);
  }

  const body = await apiFetch<unknown>(`/dealers/employer-invitations/${id}`);
  return mapInvitationDetail(unwrapApiData(body) ?? body);
}

export async function getInvitationSteps(): Promise<LeavingStep[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockInvitationSteps.map((step) => ({ ...step }));
  }

  const body = await apiFetch<unknown>("/dealers/employer-invitations/steps");
  return mapInvitationSteps(body);
}

export async function sendEmployerInvitation(
  input: EmployerInvitationSendInput,
  meta?: { employeeName: string; fadaId: string; branchName?: string },
): Promise<void> {
  if (
    !input.employeeId ||
    !input.outletId ||
    !input.departmentId ||
    !input.designationId
  ) {
    throw new ApiError({
      message: "Select branch, department, and designation",
      status: 422,
    });
  }

  if (isMockMode()) {
    await mockDelay(250);
    const branchName =
      meta?.branchName ??
      mockFilterOptions.branches.find((b) => b.value === input.outletId)
        ?.label ??
      "—";
    addMockJoinInvitation({
      id: `inv-${Date.now()}`,
      employeeName: meta?.employeeName ?? "Employee",
      fadaId: meta?.fadaId ?? "—",
      requestType: "Join",
      fromTo: branchName,
      branchId: input.outletId,
      branchName,
      requestedAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
      canDecide: true,
    });
    return;
  }

  try {
    await apiFetch("/dealers/employer-invitations/send", {
      method: "POST",
      body: {
        employeeId: Number(input.employeeId) || input.employeeId,
        outletId: Number(input.outletId) || input.outletId,
        departmentId: Number(input.departmentId) || input.departmentId,
        designationId: Number(input.designationId) || input.designationId,
      },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new ApiError({
        message: "Employee is already working at another company",
        status: 400,
      });
    }
    throw err;
  }
}

export async function updateInvitationStatus(
  id: string,
  action: "accept" | "reject",
): Promise<void> {
  if (isMockMode()) {
    await mockDelay(200);
    updateMockRequestStatus(
      id,
      action === "accept" ? "Approved" : "Rejected",
    );
    return;
  }

  await apiFetch(`/dealers/employer-invitations/${id}/status/${action}`, {
    method: "PATCH",
  });
}

export async function updateLeavingStatus(
  id: string,
  action: "accept" | "reject",
): Promise<void> {
  if (isMockMode()) {
    await mockDelay(200);
    updateMockRequestStatus(
      id,
      action === "accept" ? "Approved" : "Rejected",
    );
    return;
  }

  await apiFetch(`/dealers/employer-leaving/${id}/status/${action}`, {
    method: "PATCH",
  });
}

export async function advanceLeavingStatus(
  request: EmploymentRequest,
  status: LeavingExitStatus,
): Promise<void> {
  const completed = request.completedSteps ?? [];
  if (completed.includes(status)) {
    throw new Error("This exit step is already completed");
  }
  const expected = nextLeavingExitStatus(completed);
  if (expected !== status) {
    throw new Error("Complete the previous exit step first");
  }

  if (isMockMode()) {
    await mockDelay(200);
    advanceMockLeavingStatus(request.id, status);
    return;
  }

  if (status === "accept_resignation") {
    await updateLeavingStatus(request.id, "accept");
    return;
  }

  await apiFetch(`/dealers/employer-leaving/${request.id}/status/${status}`, {
    method: "PUT",
  });
}

export async function advanceInvitationStatus(
  request: EmploymentRequest,
  status: JoinInvitationStatus,
): Promise<void> {
  const completed = request.completedSteps ?? [];
  if (completed.includes(status)) {
    throw new Error("This join step is already completed");
  }
  const expected = nextJoinInvitationStatus(completed);
  if (expected !== status) {
    throw new Error("Complete the previous join step first");
  }

  if (isMockMode()) {
    await mockDelay(200);
    advanceMockInvitationStatus(request.id, status);
    return;
  }

  await apiFetch(
    `/dealers/employer-invitations/${request.id}/status/${status}`,
    {
      method: "PUT",
    },
  );
}

export async function updateRequestStatus(
  request: EmploymentRequest,
  action: "accept" | "reject",
): Promise<void> {
  if (request.requestType === "Exit") {
    return updateLeavingStatus(request.id, action);
  }
  return updateInvitationStatus(request.id, action);
}
