import { apiFetch, isMockMode } from "@/lib/api";
import {
  buildQuery,
  mockDelay,
  normalizeListPayload,
  unwrapApiData,
} from "@/lib/api/parse";
import {
  branches as mockBranches,
  mockGroupDealers,
} from "@/features/branches/mocks/data";
import {
  OutletImportMastersError,
  parseOutletImportFile,
  validateParsedOutletImportAgainstMasters,
} from "@/features/branches/import-file";
import { getOutletFunctions } from "@/features/masters/api";
import type { MasterIdNameItem } from "@/features/masters/types";
import type {
  Branch,
  BranchDashboard,
  BranchListParams,
  GroupDealer,
  OutletImportItem,
  OutletImportResult,
  OutletImportRowError,
  OutletImportSkippedRow,
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

type FunctionNameLookup = ReadonlyMap<string, string>;

function buildFunctionLookup(items: MasterIdNameItem[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    const id = String(item.id);
    map.set(id, item.name);
    map.set(id.toLowerCase(), item.name);
  }
  return map;
}

async function loadFunctionLookup(): Promise<Map<string, string>> {
  try {
    return buildFunctionLookup(await getOutletFunctions());
  } catch {
    return new Map();
  }
}

function lookupName(
  key: string,
  lookup?: FunctionNameLookup,
): string {
  if (!key) return "";
  return lookup?.get(key) ?? lookup?.get(key.toLowerCase()) ?? "";
}

function resolveFunctionLabel(
  item: unknown,
  lookup?: FunctionNameLookup,
): string {
  if (typeof item === "string" || typeof item === "number") {
    const key = String(item).trim();
    return lookupName(key, lookup) || key;
  }
  const record = asRecord(item);
  const name = readString(record, "name") || readString(record, "slug");
  if (name) return name;
  const id =
    readString(record, "id") ||
    readString(record, "value") ||
    (record.id != null ? String(record.id) : "");
  return lookupName(id, lookup) || id;
}

function mapFunctionIds(functions: unknown): Array<string | number> {
  if (!Array.isArray(functions)) return [];
  return functions
    .map((item) => {
      if (typeof item === "number" && Number.isFinite(item)) return item;
      if (typeof item === "string" && item.trim()) return item.trim();
      const record = asRecord(item);
      const id =
        readString(record, "id") ||
        readString(record, "slug") ||
        readString(record, "value") ||
        (record.id != null ? String(record.id) : "");
      return id || null;
    })
    .filter((id): id is string | number => id != null && id !== "");
}

/** Join master function names in API order for listing display. */
function mapFunctionsToType(
  functions: unknown,
  lookup?: FunctionNameLookup,
): string {
  if (!Array.isArray(functions) || functions.length === 0) {
    return "—";
  }
  const labels = functions
    .map((f) => resolveFunctionLabel(f, lookup).trim())
    .filter(Boolean);
  return labels.length > 0 ? labels.join(", ") : "—";
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
export function mapOutletToBranch(
  raw: unknown,
  lookup?: FunctionNameLookup,
): Branch {
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

  const brand = asRecord(record.brand);
  const brandId =
    readNumber(record, "brandId") || readNumber(brand, "id") || undefined;
  const brandName = readString(brand, "name") || undefined;
  const functionIds = mapFunctionIds(record.functions);

  return {
    id,
    name: readString(record, "name") || "Outlet",
    location: locationFromOutlet(record),
    type: mapFunctionsToType(record.functions, lookup),
    employees,
    active,
    fadaScore: readNumber(record, "fadaScore") || readNumber(record, "score"),
    status: isActive || readString(record, "status").toLowerCase() === "active"
      ? "Active"
      : "Inactive",
    code: readString(record, "code") || undefined,
    outletCode:
      readString(record, "outletCode") ||
      readString(record, "publicCode") ||
      undefined,
    manager: readString(record, "manager") || undefined,
    city: readString(record, "city") || undefined,
    state: readString(record, "state") || undefined,
    address: readString(record, "address") || undefined,
    pinCode: readString(record, "pinCode") || undefined,
    isActive,
    brandId: brandId || undefined,
    brandName: brandName || undefined,
    functionIds: functionIds.length ? functionIds : undefined,
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

function queryGroupDealerId(
  groupDealerId: string | number | undefined,
): string | number | undefined {
  if (groupDealerId == null || groupDealerId === "") return undefined;
  const asNum = Number(groupDealerId);
  return Number.isFinite(asNum) && String(asNum) === String(groupDealerId).trim()
    ? asNum
    : groupDealerId;
}

function mapGroupDealer(raw: unknown): GroupDealer | null {
  const record = asRecord(raw);
  const id =
    readString(record, "id") ||
    readString(record, "value") ||
    (record.id != null ? String(record.id) : "");
  if (!id) return null;
  const name =
    readString(record, "name") ||
    readString(record, "label") ||
    id;
  const dealerCode = readString(record, "dealerCode") || undefined;
  return { id, name, dealerCode };
}

/** GET /dealers/user/group-dealers — child dealers in group holding (Dealer - Profile). */
export async function getGroupDealers(): Promise<GroupDealer[]> {
  if (isMockMode()) {
    await mockDelay(80);
    return mockGroupDealers;
  }

  const body = await apiFetch<unknown>("/dealers/user/group-dealers", {
    skipDealerHeader: true,
  });
  const data = unwrapApiData(body);
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data).items)
      ? (asRecord(data).items as unknown[])
      : Array.isArray(asRecord(data).dealers)
        ? (asRecord(data).dealers as unknown[])
        : [];

  return rows
    .map(mapGroupDealer)
    .filter((item): item is GroupDealer => item != null);
}

async function getBranchesMock(
  params: BranchListParams = {},
): Promise<ListResult<Branch>> {
  await mockDelay();
  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const q = params.q?.trim().toLowerCase() ?? "";
  const groupId =
    params.groupDealerId != null && params.groupDealerId !== ""
      ? String(params.groupDealerId)
      : "";

  let filtered = mockBranches;
  if (groupId) {
    filtered = filtered.filter((b) => b.groupDealerId === groupId);
  }
  if (q) {
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q),
    );
  }
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
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
    groupDealerId: queryGroupDealerId(params.groupDealerId),
    search: params.q,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    isActive: params.isActive,
  });

  const [body, lookup] = await Promise.all([
    apiFetch<unknown>(`/dealers/outlets${query}`),
    loadFunctionLookup(),
  ]);
  const normalized = normalizeListPayload(body, { page, pageSize });
  return {
    items: normalized.items.map((item) => mapOutletToBranch(item, lookup)),
    total: normalized.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export async function getBranchDashboard(
  groupDealerId?: string | number,
): Promise<BranchDashboard> {
  const result = await getBranches({
    page: 1,
    pageSize: 100,
    groupDealerId: groupDealerId || undefined,
  });
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
    const outletCode =
      readString(record, "outletCode") ||
      readString(record, "publicCode") ||
      readString(record, "code") ||
      undefined;
    return { value, label, outletCode: outletCode || undefined };
  });
}

function mockOutletCodeFromId(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const n = (hash % 900000) + 100000;
  return `OT${n}`;
}

function branchFromInput(
  id: string,
  input: OutletInput,
  existing?: Branch,
  lookup?: FunctionNameLookup,
): Branch {
  return {
    ...(existing ?? {
      id,
      employees: 0,
      active: 0,
      fadaScore: 0,
    }),
    id,
    name: input.name,
    location:
      [input.city, input.state, input.address].filter(Boolean).join(", ") || "—",
    type: mapFunctionsToType(input.functions, lookup),
    status: input.isActive === false ? "Inactive" : "Active",
    code: input.code,
    outletCode: existing?.outletCode ?? mockOutletCodeFromId(id),
    manager: input.manager,
    city: input.city,
    state: input.state,
    address: input.address,
    pinCode: input.pinCode,
    isActive: input.isActive !== false,
    brandId: input.brandId,
    functionIds: input.functions,
  };
}

/** GET /dealers/outlets/:id — full outlet for edit hydrate. */
export async function getOutletById(id: string): Promise<Branch> {
  if (isMockMode()) {
    await mockDelay(80);
    const existing = mockBranches.find((b) => b.id === id);
    if (existing) return existing;
    throw new Error("Outlet not found");
  }

  const [body, lookup] = await Promise.all([
    apiFetch<unknown>(`/dealers/outlets/${id}`),
    loadFunctionLookup(),
  ]);
  return mapOutletToBranch(unwrapApiData(body) ?? body, lookup);
}

export async function createOutlet(input: OutletInput): Promise<Branch> {
  if (isMockMode()) {
    await mockDelay();
    return branchFromInput(`mock-${Date.now()}`, input);
  }

  const [body, lookup] = await Promise.all([
    apiFetch<unknown>("/dealers/outlets", {
      method: "POST",
      body: input,
    }),
    loadFunctionLookup(),
  ]);
  return mapOutletToBranch(unwrapApiData(body) ?? body, lookup);
}

export async function updateOutlet(
  id: string,
  input: OutletInput,
): Promise<Branch> {
  if (isMockMode()) {
    await mockDelay();
    const existing = mockBranches.find((b) => b.id === id);
    return branchFromInput(id, input, existing);
  }

  const [body, lookup] = await Promise.all([
    apiFetch<unknown>(`/dealers/outlets/${id}`, {
      method: "PUT",
      body: input,
    }),
    loadFunctionLookup(),
  ]);
  return mapOutletToBranch(unwrapApiData(body) ?? body, lookup);
}

export async function deleteOutlet(id: string): Promise<void> {
  if (isMockMode()) {
    await mockDelay();
    return;
  }
  await apiFetch(`/dealers/outlets/${id}`, { method: "DELETE" });
}

function mapImportSkippedRow(raw: unknown): OutletImportSkippedRow | null {
  const record = asRecord(raw);
  const name = readString(record, "name");
  if (!name) return null;

  const outletFunctions = Array.isArray(record.outletFunctions)
    ? record.outletFunctions
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

  const item: OutletImportSkippedRow = {
    name,
    brandName: readString(record, "brandName"),
    outletFunctions,
    reason: readString(record, "reason") || "Import skipped",
  };

  const manager = readString(record, "manager");
  const pincode =
    readString(record, "pincode") || readString(record, "pinCode");
  const city = readString(record, "city");
  const state = readString(record, "state");
  const address = readString(record, "address");

  if (manager) item.manager = manager;
  if (pincode) item.pincode = pincode;
  if (city) item.city = city;
  if (state) item.state = state;
  if (address) item.address = address;

  return item;
}

function findImportRowNumber(
  items: OutletImportItem[],
  skipped: OutletImportSkippedRow,
): number {
  const name = skipped.name.trim().toLowerCase();
  const brandName = skipped.brandName.trim().toLowerCase();
  const index = items.findIndex(
    (item) =>
      item.name.trim().toLowerCase() === name &&
      item.brandName.trim().toLowerCase() === brandName,
  );
  return index >= 0 ? index + 2 : 0;
}

/** Map parsed items + API skipped rows into UI result counts. */
export function buildOutletImportResult(
  items: OutletImportItem[],
  skippedRows: OutletImportSkippedRow[],
  parseErrors: OutletImportRowError[] = [],
): OutletImportResult {
  if (parseErrors.length > 0) {
    return {
      total: items.length + parseErrors.length,
      created: 0,
      failed: parseErrors.length,
      errors: parseErrors,
    };
  }

  const total = items.length;
  const errors: OutletImportRowError[] = skippedRows.map((row) => ({
    row: findImportRowNumber(items, row),
    message: row.reason,
  }));
  const failed = errors.length;

  return {
    total,
    created: total - failed,
    failed,
    errors,
  };
}

function mapImportSkippedRows(raw: unknown): OutletImportSkippedRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(mapImportSkippedRow)
    .filter((row): row is OutletImportSkippedRow => row != null);
}

function mockImportSkippedRows(
  items: OutletImportItem[],
): OutletImportSkippedRow[] {
  return items.flatMap((item) => {
    const nameLower = item.name.toLowerCase();
    const brandLower = item.brandName.toLowerCase();

    if (nameLower.includes("skip")) {
      return [{ ...item, reason: "Outlet already exists" }];
    }
    if (brandLower.includes("invalid")) {
      return [{ ...item, reason: "Brand not found" }];
    }
    return [];
  });
}

/**
 * Bulk import from CSV or XLSX. Parses client-side, validates against live
 * masters, then POST JSON array to `/dealers/outlets/import`.
 * See `deploy/OUTLET_CSV_IMPORT_API.md`.
 */
export async function importOutletsFile(
  file: File,
): Promise<OutletImportResult> {
  const { items, errors: parseErrors } = await parseOutletImportFile(file);

  if (parseErrors.length > 0) {
    return buildOutletImportResult(items, [], parseErrors);
  }

  if (items.length === 0) {
    return {
      total: 0,
      created: 0,
      failed: 0,
      errors: [{ row: 1, message: "Import file has no data rows" }],
    };
  }

  let masterErrors: OutletImportRowError[];
  try {
    masterErrors = await validateParsedOutletImportAgainstMasters(items);
  } catch {
    throw new OutletImportMastersError();
  }

  if (masterErrors.length > 0) {
    return buildOutletImportResult(items, [], masterErrors);
  }

  if (isMockMode()) {
    await mockDelay(400);
    const skipped = mockImportSkippedRows(items);
    return buildOutletImportResult(items, skipped);
  }

  const body = await apiFetch<unknown>("/dealers/outlets/import", {
    method: "POST",
    body: items,
  });
  const skipped = mapImportSkippedRows(unwrapApiData(body) ?? body);
  return buildOutletImportResult(items, skipped);
}

/** @deprecated Use importOutletsFile — accepts CSV and XLSX. */
export const importOutletsCsv = importOutletsFile;

export { OutletImportMastersError } from "@/features/branches/import-file";
