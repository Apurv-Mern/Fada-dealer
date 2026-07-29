import { apiFetch, isMockMode } from "@/lib/api";
import {
  buildQuery,
  mockDelay,
  normalizeListPayload,
  unwrapApiData,
} from "@/lib/api/parse";
import { getOutletOptions } from "@/features/branches/api";
import {
  employeeFilterOptions as mockFilterOptions,
  employeeStats as mockStats,
  employees as mockEmployees,
} from "@/features/employees/mocks/data";
import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeInput,
  EmployeeListParams,
  EmployeeStats,
  EmployeeStatus,
} from "@/features/employees/types";
import type { ListResult } from "@/types/api";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : value != null ? String(value) : "";
}

function readNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return 0;
}

function readBool(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return value === true || value === "true" || value === 1;
}

function nested(record: Record<string, unknown>, key: string): Record<string, unknown> {
  return asRecord(record[key]);
}

export function mapApiEmployee(raw: unknown): Employee {
  const record = asRecord(raw);
  const assignment = nested(record, "assignment");
  const outlet = nested(record, "outlet");
  const designationObj = nested(record, "designation");
  const isActive = "isActive" in record ? readBool(record, "isActive") : true;

  let status: EmployeeStatus = isActive ? "Active" : "Inactive";
  const statusRaw = readString(record, "status").toLowerCase();
  if (statusRaw.includes("notice")) status = "On Notice";
  else if (statusRaw === "inactive" || statusRaw === "exited") status = "Inactive";
  else if (statusRaw === "active") status = "Active";

  const branchName =
    readString(outlet, "name") ||
    readString(record, "branch") ||
    readString(record, "outletName") ||
    "—";
  const branchId =
    readString(assignment, "outletId") ||
    readString(outlet, "id") ||
    readString(record, "outletId") ||
    readString(record, "branchId") ||
    "";

  const designationName =
    readString(designationObj, "name") ||
    readString(record, "designation") ||
    "—";
  const designationId =
    readString(designationObj, "designationId") ||
    readString(designationObj, "id") ||
    readString(record, "designationId") ||
    "";

  return {
    id: readString(record, "id") || String(record.id ?? ""),
    name: readString(record, "name") || "Employee",
    email: readString(record, "email"),
    phone: readString(record, "phone"),
    fadaId:
      readString(record, "fadaId") ||
      readString(record, "fadaID") ||
      "—",
    branch: branchName,
    branchId,
    designation: designationName,
    designationId,
    status,
    fadaScore: readNumber(record, "score") || readNumber(record, "fadaScore"),
    isActive,
    joinedDate: readString(record, "joinedDate") || undefined,
  };
}

function filterEmployees(
  rows: Employee[],
  params: EmployeeListParams,
): Employee[] {
  const q = params.q?.trim().toLowerCase() ?? "";
  return rows.filter((row) => {
    if (params.branchId && row.branchId !== params.branchId) return false;
    if (params.designationId && row.designationId !== params.designationId) {
      return false;
    }
    if (params.status && row.status !== params.status) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.fadaId.toLowerCase().includes(q) ||
      row.branch.toLowerCase().includes(q)
    );
  });
}

function deriveStats(rows: Employee[]): EmployeeStats {
  return {
    total: rows.length,
    active: rows.filter((r) => r.status === "Active").length,
    newJoins: 0,
    exited: rows.filter((r) => r.status === "Inactive").length,
  };
}

async function getEmployeesMock(
  params: EmployeeListParams = {},
): Promise<ListResult<Employee>> {
  await mockDelay();
  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const filtered = filterEmployees(mockEmployees, params);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getEmployees(
  params: EmployeeListParams = {},
): Promise<ListResult<Employee>> {
  if (isMockMode()) return getEmployeesMock(params);

  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  let isActive: boolean | undefined;
  if (params.status === "Active") isActive = true;
  else if (params.status === "Inactive") isActive = false;

  const query = buildQuery({
    search: params.q,
    outletId: params.branchId ? Number(params.branchId) || params.branchId : undefined,
    isActive,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const body = await apiFetch<unknown>(`/dealers/employees${query}`);
  const normalized = normalizeListPayload(body, { page, pageSize });
  let items = normalized.items.map(mapApiEmployee);

  if (params.designationId) {
    items = items.filter((e) => e.designationId === params.designationId);
  }
  if (params.status === "On Notice") {
    items = items.filter((e) => e.status === "On Notice");
  }

  return {
    items,
    total: normalized.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  if (isMockMode()) {
    await mockDelay(120);
    return mockStats;
  }

  // No dedicated stats endpoint — derive from a broader list fetch.
  const result = await getEmployees({ page: 1, pageSize: 100 });
  return deriveStats(result.items);
}

export async function getEmployeeFilterOptions(): Promise<EmployeeFilterOptions> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockFilterOptions;
  }

  const [outlets, list] = await Promise.all([
    getOutletOptions(),
    getEmployees({ page: 1, pageSize: 100 }),
  ]);

  const designationMap = new Map<string, string>();
  for (const emp of list.items) {
    if (emp.designationId && emp.designation && emp.designation !== "—") {
      designationMap.set(emp.designationId, emp.designation);
    }
  }

  return {
    branches: outlets,
    designations: Array.from(designationMap.entries()).map(([value, label]) => ({
      value,
      label,
    })),
  };
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id: `mock-${Date.now()}`,
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      fadaId: "—",
      branch: "—",
      branchId: input.outletId ?? "",
      designation: "—",
      designationId: "",
      status: input.isActive === false ? "Inactive" : "Active",
      fadaScore: input.score ?? 0,
      isActive: input.isActive !== false,
      joinedDate: input.joinedDate,
    };
  }

  const body = await apiFetch<unknown>("/dealers/employees", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      score: input.score,
      joinedDate: input.joinedDate,
      isActive: input.isActive ?? true,
      assignment: input.outletId
        ? { outletId: Number(input.outletId) || input.outletId, isActive: true }
        : undefined,
    },
  });
  return mapApiEmployee(unwrapApiData(body) ?? body);
}

export async function updateEmployee(
  id: string,
  input: EmployeeInput,
): Promise<Employee> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id,
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      fadaId: "—",
      branch: "—",
      branchId: input.outletId ?? "",
      designation: "—",
      designationId: "",
      status: input.isActive === false ? "Inactive" : "Active",
      fadaScore: input.score ?? 0,
      isActive: input.isActive !== false,
      joinedDate: input.joinedDate,
    };
  }

  const body = await apiFetch<unknown>(`/dealers/employees/${id}`, {
    method: "PUT",
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      score: input.score,
      joinedDate: input.joinedDate,
      isActive: input.isActive ?? true,
      assignment: input.outletId
        ? { outletId: Number(input.outletId) || input.outletId, isActive: true }
        : undefined,
    },
  });
  return mapApiEmployee(unwrapApiData(body) ?? body);
}

export async function deleteEmployee(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/employees/${id}`, { method: "DELETE" });
}

export async function deactivateEmployee(employee: Employee): Promise<Employee> {
  return updateEmployee(employee.id, {
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    score: employee.fadaScore,
    outletId: employee.branchId || undefined,
    isActive: false,
    joinedDate: employee.joinedDate,
  });
}
