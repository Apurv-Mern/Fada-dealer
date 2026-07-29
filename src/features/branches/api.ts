import { apiFetch, isMockMode } from "@/lib/api";
import {
  buildQuery,
  mockDelay,
  normalizeListPayload,
  unwrapApiData,
} from "@/lib/api/parse";
import {
  branchPerformance,
  branchScores,
  branchStats,
  branches as mockBranches,
  employeesByBranch,
} from "@/features/branches/mocks/data";
import type {
  Branch,
  BranchDashboard,
  BranchListParams,
  BranchType,
  OutletInput,
  OutletOption,
} from "@/features/branches/types";
import type { ListResult } from "@/types/api";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

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

function mapFunctionsToType(functions: unknown): BranchType {
  if (!Array.isArray(functions) || functions.length === 0) {
    return "Sales & Service";
  }
  const labels = functions.map((f) => String(f).toLowerCase());
  const hasSales = labels.some((l) => l.includes("sales"));
  const hasService = labels.some((l) => l.includes("service"));
  if (hasSales && hasService) return "Sales & Service";
  if (hasService) return "Service";
  if (hasSales) return "Sales";
  return "Sales & Service";
}

function locationFromOutlet(record: Record<string, unknown>): string {
  const parts = [
    readString(record, "city"),
    readString(record, "state"),
    readString(record, "address"),
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return readString(record, "location") || "—";
}

/** Map Node outlet payload → Branch UI model. */
export function mapOutletToBranch(raw: unknown): Branch {
  const record = asRecord(raw);
  const id = readString(record, "id") || String(record.id ?? "");
  const isActive = readBool(record, "isActive");
  const employees =
    readNumber(record, "employees") ||
    readNumber(record, "totalEmployees") ||
    readNumber(record, "employeeCount");
  const active =
    readNumber(record, "active") ||
    readNumber(record, "activeEmployees") ||
    (isActive ? employees : 0);

  return {
    id,
    name: readString(record, "name") || "Outlet",
    location: locationFromOutlet(record),
    type: mapFunctionsToType(record.functions),
    employees,
    active,
    fadaScore: readNumber(record, "fadaScore") || readNumber(record, "score"),
    status: isActive || readString(record, "status").toLowerCase() === "active"
      ? "Active"
      : "Inactive",
    code: readString(record, "code") || undefined,
    manager: readString(record, "manager") || undefined,
    city: readString(record, "city") || undefined,
    state: readString(record, "state") || undefined,
    address: readString(record, "address") || undefined,
    pinCode: readString(record, "pinCode") || undefined,
    isActive,
  };
}

function deriveDashboard(branches: Branch[]): BranchDashboard {
  const activeBranches = branches.filter((b) => b.status === "Active").length;
  const totalEmployees = branches.reduce((sum, b) => sum + b.employees, 0);
  const avgFadaScore =
    branches.length === 0
      ? 0
      : Math.round(
          branches.reduce((sum, b) => sum + b.fadaScore, 0) / branches.length,
        );

  const employeesByBranch = branches.map((b, i) => ({
    label: b.name,
    value: Math.max(b.employees, 0),
    color: CHART_COLORS[i % CHART_COLORS.length]!,
  }));

  const branchScores = branches.map((b, i) => ({
    label: b.name,
    value: Math.max(b.fadaScore, 0),
    color: CHART_COLORS[i % CHART_COLORS.length]!,
  }));

  const branchPerformance = branches.slice(0, 4).map((b, i) => ({
    label: b.name,
    value: b.fadaScore || b.employees,
    tone: (["green", "blue", "orange", "red"] as const)[i % 4]!,
  }));

  return {
    stats: {
      totalBranches: branches.length,
      activeBranches,
      totalEmployees,
      avgFadaScore,
    },
    branches,
    employeesByBranch,
    branchScores,
    branchPerformance,
  };
}

async function getBranchesMock(
  params: BranchListParams = {},
): Promise<ListResult<Branch>> {
  await mockDelay();
  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = params.q?.trim().toLowerCase() ?? "";
  const filtered = q
    ? mockBranches.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q),
      )
    : mockBranches;
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

async function getBranchDashboardMock(): Promise<BranchDashboard> {
  await mockDelay();
  return {
    stats: branchStats,
    branches: mockBranches,
    employeesByBranch,
    branchScores,
    branchPerformance,
  };
}

/** Paginated outlet list mapped to Branch UI model. */
export async function getBranches(
  params: BranchListParams = {},
): Promise<ListResult<Branch>> {
  if (isMockMode()) return getBranchesMock(params);

  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const query = buildQuery({
    search: params.q,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    isActive: params.isActive,
  });

  const body = await apiFetch<unknown>(`/dealers/outlets${query}`);
  const normalized = normalizeListPayload(body, { page, pageSize });
  return {
    items: normalized.items.map(mapOutletToBranch),
    total: normalized.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export async function getBranchDashboard(): Promise<BranchDashboard> {
  if (isMockMode()) return getBranchDashboardMock();

  const result = await getBranches({ page: 1, pageSize: 100 });
  return deriveDashboard(result.items);
}

export async function getOutletOptions(): Promise<OutletOption[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockBranches.map((b) => ({ value: b.id, label: b.name }));
  }

  const body = await apiFetch<unknown>("/dealers/outlets/options");
  const data = unwrapApiData(body);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data).items)
      ? (asRecord(data).items as unknown[])
      : Array.isArray(asRecord(data).options)
        ? (asRecord(data).options as unknown[])
        : [];

  return rows.map((row) => {
    const record = asRecord(row);
    const value =
      readString(record, "id") ||
      readString(record, "value") ||
      String(record.id ?? "");
    const label =
      readString(record, "name") ||
      readString(record, "label") ||
      value;
    return { value, label };
  });
}

export async function createOutlet(input: OutletInput): Promise<Branch> {
  if (isMockMode()) {
    await mockDelay();
    return {
      id: `mock-${Date.now()}`,
      name: input.name,
      location: [input.city, input.state, input.address]
        .filter(Boolean)
        .join(", ") || "—",
      type: "Sales & Service",
      employees: 0,
      active: 0,
      fadaScore: 0,
      status: input.isActive === false ? "Inactive" : "Active",
      code: input.code,
      manager: input.manager,
      city: input.city,
      state: input.state,
      address: input.address,
      pinCode: input.pinCode,
      isActive: input.isActive !== false,
    };
  }

  const body = await apiFetch<unknown>("/dealers/outlets", {
    method: "POST",
    body: input,
  });
  return mapOutletToBranch(unwrapApiData(body) ?? body);
}

export async function updateOutlet(
  id: string,
  input: OutletInput,
): Promise<Branch> {
  if (isMockMode()) {
    await mockDelay();
    const existing = mockBranches.find((b) => b.id === id);
    return {
      ...(existing ?? {
        id,
        employees: 0,
        active: 0,
        fadaScore: 0,
        type: "Sales & Service" as const,
      }),
      id,
      name: input.name,
      location: [input.city, input.state, input.address]
        .filter(Boolean)
        .join(", ") || "—",
      status: input.isActive === false ? "Inactive" : "Active",
      isActive: input.isActive !== false,
    };
  }

  const body = await apiFetch<unknown>(`/dealers/outlets/${id}`, {
    method: "PUT",
    body: input,
  });
  return mapOutletToBranch(unwrapApiData(body) ?? body);
}

export async function deleteOutlet(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/outlets/${id}`, { method: "DELETE" });
}
