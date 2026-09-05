import type { BarItem } from "@/components/ui/bar-chart";
import type { BadgeProps } from "@/components/ui/badge";
import {
  DEALER_REPORT_KEYS,
  DEFAULT_REPORT_PAGE_SIZE,
  EVENT_TYPE_OPTIONS,
  type DealerReportKey,
  type ReportCatalogItem,
  type ReportFilterField,
  type ReportFilterOption,
  type ReportFiltersMetadata,
  type ReportMeta,
  type ReportQueryParams,
  type ReportResult,
  type ReportScalar,
  type ReportUrlQuery,
} from "@/features/reports/types";

const REPORT_LABELS: Record<DealerReportKey, { name: string; description: string }> = {
  "employee-master": {
    name: "Employee Master",
    description: "Roster of employees under your dealership with assignment details.",
  },
  "onboarding-verification": {
    name: "Onboarding & Verification",
    description: "Track onboarding progress and document verification status.",
  },
  "employee-movement": {
    name: "Employee Movement",
    description: "Joining, transfer, and exit activity across outlets.",
  },
  "workforce-analytics": {
    name: "Workforce Analytics",
    description: "Headcount and workforce composition breakdowns.",
  },
  "adoption-compliance": {
    name: "Adoption & Compliance",
    description: "Profile completion and compliance adoption metrics.",
  },
};

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

function mapFilterOptions(raw: unknown): ReportFilterOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const record = asRecord(item);
      const value =
        readString(record, "value") ||
        readString(record, "id") ||
        readString(record, "key");
      const label =
        readString(record, "label") ||
        readString(record, "name") ||
        value;
      if (!value) return null;
      return { label, value };
    })
    .filter((item): item is ReportFilterOption => item !== null);
}

function fallbackCatalog(): ReportCatalogItem[] {
  return DEALER_REPORT_KEYS.map((key) => ({
    key,
    name: REPORT_LABELS[key].name,
    description: REPORT_LABELS[key].description,
  }));
}

function mapCatalogItem(raw: unknown): ReportCatalogItem | null {
  const record = asRecord(raw);
  const key =
    readString(record, "key") ||
    readString(record, "reportKey") ||
    readString(record, "value");
  if (!DEALER_REPORT_KEYS.includes(key as DealerReportKey)) return null;
  const typedKey = key as DealerReportKey;
  const fallback = REPORT_LABELS[typedKey];
  return {
    key: typedKey,
    name: readString(record, "name") || readString(record, "reportName") || fallback.name,
    description:
      readString(record, "description") ||
      readString(record, "summary") ||
      fallback.description,
  };
}

export function mapReportFiltersMetadata(body: unknown): ReportFiltersMetadata {
  const unwrapped = body && typeof body === "object" && "data" in (body as object)
    ? (body as { data: unknown }).data
    : body;
  const record = asRecord(unwrapped);

  let reports: ReportCatalogItem[] = [];
  const reportsRaw =
    record.reports ??
    record.reportCatalog ??
    record.availableReports ??
    record.items;
  if (Array.isArray(reportsRaw)) {
    reports = reportsRaw
      .map(mapCatalogItem)
      .filter((item): item is ReportCatalogItem => item !== null);
  }
  if (reports.length === 0) {
    reports = fallbackCatalog();
  }

  const filters = asRecord(record.filters ?? record.filterOptions ?? record);

  return {
    reports,
    departments: mapFilterOptions(filters.departments ?? record.departments),
    designations: mapFilterOptions(filters.designations ?? record.designations),
  };
}

export function isScalarSummaryValue(value: unknown): value is ReportScalar {
  return (
    typeof value === "number" ||
    typeof value === "string" ||
    typeof value === "boolean"
  );
}

export function isBreakdownSummaryKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized.startsWith("by") ||
    normalized.includes("by") ||
    normalized === "stages" ||
    normalized.startsWith("coverage") ||
    normalized.endsWith("breakdown") ||
    normalized.endsWith("distribution")
  );
}

export function partitionReportSummary(summary: Record<string, unknown>): {
  scalars: Record<string, ReportScalar>;
  breakdownsFromSummary: Record<string, unknown>;
} {
  const scalars: Record<string, ReportScalar> = {};
  const breakdownsFromSummary: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(summary)) {
    if (value === null || value === undefined || value === "") continue;

    if (isScalarSummaryValue(value) && !isBreakdownSummaryKey(key)) {
      scalars[key] = value;
      continue;
    }

    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      breakdownsFromSummary[key] = value;
    }
  }

  return { scalars, breakdownsFromSummary };
}

export function mergeBreakdownSources(
  breakdowns: Record<string, unknown>,
  breakdownsFromSummary: Record<string, unknown>,
): Record<string, unknown> {
  return { ...breakdownsFromSummary, ...breakdowns };
}

export function mapReportMeta(raw: unknown): ReportMeta {
  const record = asRecord(raw);
  return {
    reportKey: readString(record, "reportKey"),
    reportName: readString(record, "reportName"),
    portal:
      record.portal === "admin" || record.portal === "dealer"
        ? record.portal
        : undefined,
    period:
      record.period && typeof record.period === "object"
        ? (record.period as Record<string, unknown>)
        : null,
    filtersApplied: asRecord(record.filtersApplied),
    generatedAt: readString(record, "generatedAt") || undefined,
    generatedBy:
      record.generatedBy && typeof record.generatedBy === "object"
        ? (record.generatedBy as Record<string, unknown>)
        : null,
  };
}

export function mapReportResult(
  body: unknown,
  fallback: { page: number; pageSize: number },
): ReportResult {
  const unwrapped = body && typeof body === "object" && "data" in (body as object)
    ? (body as { data: unknown }).data
    : body;
  const record = asRecord(unwrapped);
  const meta = mapReportMeta(record.meta ?? record);
  const summary = asRecord(record.summary);
  const rowsRaw = record.rows;
  const rows = Array.isArray(rowsRaw)
    ? normalizeReportRows(rowsRaw.map((row) => asRecord(row)))
    : [];
  const breakdowns = asRecord(record.breakdowns);

  const { scalars: summaryScalars, breakdownsFromSummary } =
    partitionReportSummary(summary);
  const mergedBreakdowns = mergeBreakdownSources(
    breakdowns,
    breakdownsFromSummary,
  );

  const pagination = asRecord(record.pagination);
  const limit =
    typeof pagination.limit === "number" && pagination.limit > 0
      ? pagination.limit
      : fallback.pageSize;
  const offset =
    typeof pagination.offset === "number" && pagination.offset >= 0
      ? pagination.offset
      : (fallback.page - 1) * limit;
  const total =
    typeof pagination.total === "number"
      ? pagination.total
      : rows.length;

  return {
    meta,
    summary,
    summaryScalars,
    rows,
    breakdowns: mergedBreakdowns,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
  };
}

export function getVisibleReportFilters(
  reportKey: DealerReportKey,
): ReportFilterField[] {
  const common: ReportFilterField[] = [
    "search",
    "fromDate",
    "toDate",
    "departmentId",
    "designationId",
  ];

  switch (reportKey) {
    case "onboarding-verification":
      return [...common, "verificationStatus", "stage"];
    case "employee-movement":
      return [...common, "eventType"];
    case "adoption-compliance":
      return [...common, "profileStatus", "membershipStatus", "fadaIdStatus"];
    case "employee-master":
      return [...common, "employmentStatus", "fadaIdStatus"];
    case "workforce-analytics":
    default:
      return common;
  }
}

/** Swagger query params for generate/export (excluding pagination aliases). */
export function buildReportApiQuery(
  params: ReportQueryParams & { format?: "xlsx" | "pdf" },
  options?: { includePagination?: boolean },
): Record<string, string | number | boolean | undefined | null> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_REPORT_PAGE_SIZE;
  const query: Record<string, string | number | boolean | undefined | null> = {
    search: params.search || undefined,
    fromDate: params.fromDate,
    toDate: params.toDate,
    departmentId: params.departmentId
      ? Number(params.departmentId) || params.departmentId
      : undefined,
    designationId: params.designationId
      ? Number(params.designationId) || params.designationId
      : undefined,
    employmentStatus: params.employmentStatus,
    fadaIdStatus: params.fadaIdStatus,
    profileStatus: params.profileStatus,
    verificationStatus: params.verificationStatus,
    membershipStatus: params.membershipStatus,
    stage: params.stage,
    eventType: params.eventType,
    format: params.format,
  };

  if (options?.includePagination !== false) {
    query.limit = pageSize;
    query.offset = (page - 1) * pageSize;
  }

  return query;
}

export function reportUrlQueryToApiParams(
  query: ReportUrlQuery,
): ReportQueryParams {
  return {
    search: query.search || undefined,
    fromDate: query.fromDate || undefined,
    toDate: query.toDate || undefined,
    departmentId: query.departmentId || undefined,
    designationId: query.designationId || undefined,
    employmentStatus: query.employmentStatus || undefined,
    fadaIdStatus: query.fadaIdStatus || undefined,
    profileStatus: query.profileStatus || undefined,
    verificationStatus: query.verificationStatus || undefined,
    membershipStatus: query.membershipStatus || undefined,
    stage: query.stage || undefined,
    eventType: query.eventType || undefined,
    page: query.page,
    pageSize: query.pageSize,
  };
}

const REPORT_FILTER_FIELDS: ReportFilterField[] = [
  "search",
  "fromDate",
  "toDate",
  "departmentId",
  "designationId",
  "employmentStatus",
  "fadaIdStatus",
  "profileStatus",
  "verificationStatus",
  "membershipStatus",
  "stage",
  "eventType",
];

/** Drop filters that do not apply to the active report tab. */
export function sanitizeReportQueryForKey(
  reportKey: DealerReportKey,
  query: ReportUrlQuery,
): ReportUrlQuery {
  const visible = new Set(getVisibleReportFilters(reportKey));
  const next = { ...query };

  for (const key of REPORT_FILTER_FIELDS) {
    if (!visible.has(key)) {
      next[key] = "";
    }
  }

  return next;
}

/** Export params for the currently selected report tab (no pagination). */
export function reportExportParams(
  reportKey: DealerReportKey,
  query: ReportUrlQuery,
): ReportQueryParams {
  const sanitized = sanitizeReportQueryForKey(reportKey, query);
  const {
    page: _page,
    pageSize: _pageSize,
    search: _search,
    ...params
  } = reportUrlQueryToApiParams(sanitized);
  return params;
}

export function formatReportLabel(key: string): string {
  return key
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatSummaryLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

const COLUMN_LABEL_OVERRIDES: Record<string, string> = {
  dealerName: "Company Name",
  dealershipName: "Company Name",
  companyName: "Company Name",
};

const COMPANY_NAME_COLUMNS = new Set([
  "dealerName",
  "dealershipName",
  "companyName",
]);

function readNestedName(row: Record<string, unknown>, key: string): string {
  return readString(asRecord(row[key]), "name").trim();
}

/** Resolve company/dealership display name from flat or nested API row fields. */
export function resolveCompanyName(row: Record<string, unknown>): string {
  return (
    readString(row, "dealerName").trim() ||
    readString(row, "companyName").trim() ||
    readString(row, "dealershipName").trim() ||
    readNestedName(row, "dealership") ||
    readNestedName(row, "dealer") ||
    readNestedName(row, "company")
  );
}

/** Flatten nested company name into dealerName for table columns. */
export function normalizeReportRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const companyName = resolveCompanyName(row);
  if (!companyName) return row;
  return { ...row, dealerName: companyName };
}

export function normalizeReportRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.map(normalizeReportRow);
}

export function formatColumnLabel(key: string): string {
  return COLUMN_LABEL_OVERRIDES[key] ?? formatSummaryLabel(key);
}

export function getReportCellValue(
  row: Record<string, unknown>,
  column: string,
): unknown {
  if (COMPANY_NAME_COLUMNS.has(column)) {
    const companyName = resolveCompanyName(row);
    if (companyName) return companyName;
  }
  return row[column];
}

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;

export function isDateColumnKey(columnKey: string): boolean {
  const key = columnKey.toLowerCase();
  return (
    key.includes("date") ||
    key.endsWith("at") ||
    key === "pendingsince" ||
    key === "generatedat"
  );
}

export function formatReportDate(value: string, includeTime = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (includeTime) {
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isStatusColumnKey(columnKey: string): boolean {
  const key = columnKey.toLowerCase();
  return (
    key === "status" ||
    key === "currentstage" ||
    key === "fadaidstatus" ||
    key === "ageingbucket" ||
    key.endsWith("status")
  );
}

export function reportStatusBadgeVariant(
  value: string,
): NonNullable<BadgeProps["variant"]> {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("active") ||
    normalized.includes("approved") ||
    normalized.includes("verified") ||
    normalized.includes("complete") ||
    normalized.includes("created")
  ) {
    return "success";
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("notice")
  ) {
    return "warning";
  }
  if (
    normalized.includes("reject") ||
    normalized.includes("inactive") ||
    normalized.includes("failed")
  ) {
    return "danger";
  }
  if (normalized.includes("registered") || normalized.includes("draft")) {
    return "info";
  }
  return "muted";
}

export function formatScalarDisplay(
  key: string,
  value: ReportScalar,
): string | number {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey.includes("percent") ||
      normalizedKey.includes("percentage") ||
      normalizedKey.includes("coverage")
    ) {
      return `${value}%`;
    }
    return value;
  }
  return value;
}

function formatArrayCellValue(value: unknown[]): string {
  return value
    .map((item) => {
      if (item === null || item === undefined) return "";
      if (typeof item === "string" || typeof item === "number") return String(item);
      if (typeof item === "boolean") return item ? "Yes" : "No";
      const record = asRecord(item);
      return (
        readString(record, "label") ||
        readString(record, "name") ||
        readString(record, "stage") ||
        readString(record, "status") ||
        readString(record, "department") ||
        readString(record, "designation") ||
        ""
      );
    })
    .filter(Boolean)
    .join(", ");
}

export function formatCellValue(value: unknown, columnKey?: string): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "string") {
    if (columnKey && isDateColumnKey(columnKey) && ISO_DATE_PATTERN.test(value)) {
      return formatReportDate(value, columnKey.toLowerCase().endsWith("at"));
    }
    if (columnKey && KEYWORD_VALUE_COLUMNS.has(columnKey)) {
      return formatKeywordCellValue(value, columnKey);
    }
    return value;
  }

  if (typeof value === "number") return String(value);

  if (Array.isArray(value)) {
    const formatted = formatArrayCellValue(value);
    return formatted || "—";
  }

  if (typeof value === "object") {
    const record = asRecord(value);
    return (
      readString(record, "name") ||
      readString(record, "label") ||
      readString(record, "stage") ||
      "—"
    );
  }

  return String(value);
}

const ROW_SKIP_KEYS = new Set(["id", "employeeId", "dealerId"]);

export function deriveRowColumns(rows: Record<string, unknown>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (ROW_SKIP_KEYS.has(key)) continue;
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        continue;
      }
      keys.add(key);
    }
  }
  return Array.from(keys);
}

const BREAKDOWN_COLORS = [
  "var(--color-primary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-purple)",
  "var(--color-warning)",
] as const;

function breakdownColor(index: number): string {
  return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length] ?? BREAKDOWN_COLORS[0];
}

const BREAKDOWN_MAX_ITEMS = 12;

const BREAKDOWN_CHART_TITLES: Record<string, string> = {
  stages: "Onboarding stages",
};

function looksLikeSlug(value: string): boolean {
  return /[-_]/.test(value) || (value === value.toLowerCase() && !value.includes(" "));
}

const KEYWORD_VALUE_COLUMNS = new Set([
  "eventType",
  "statusDetail",
  "status_detail",
]);

/** Human-readable labels for slug/keyword report cell values. */
export function formatKeywordCellValue(value: string, columnKey: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (columnKey === "eventType") {
    const match = EVENT_TYPE_OPTIONS.find((option) => option.value === trimmed);
    if (match) return match.label;
  }

  if (looksLikeSlug(trimmed)) {
    return formatSummaryLabel(trimmed);
  }

  return value;
}

function normalizeBreakdownLabel(raw: string): string {
  if (!raw || !looksLikeSlug(raw)) return raw;
  return formatSummaryLabel(raw);
}

function breakdownSeries(raw: unknown): BarItem[] {
  let items: BarItem[] = [];

  if (Array.isArray(raw)) {
    items = raw
      .map((item, index) => {
        const record = asRecord(item);
        const explicit =
          readString(record, "label") || readString(record, "name");
        const fallback =
          readString(record, "department") ||
          readString(record, "designation") ||
          readString(record, "stage") ||
          readString(record, "status") ||
          readString(record, "bucket") ||
          `Item ${index + 1}`;
        const label = explicit
          ? normalizeBreakdownLabel(explicit)
          : formatSummaryLabel(fallback);
        const value =
          typeof record.value === "number"
            ? record.value
            : typeof record.count === "number"
              ? record.count
              : typeof record.total === "number"
                ? record.total
                : typeof record.percentage === "number"
                  ? record.percentage
                  : Number(
                      record.value ??
                        record.count ??
                        record.total ??
                        record.percentage ??
                        0,
                    );
        return {
          label,
          value: Number.isFinite(value) ? value : 0,
          color: breakdownColor(index),
        };
      })
      .filter((item) => item.label);
  } else if (raw && typeof raw === "object") {
    items = Object.entries(raw as Record<string, unknown>).map(
      ([label, value], index) => ({
        label: formatSummaryLabel(label),
        value: typeof value === "number" ? value : Number(value) || 0,
        color: breakdownColor(index),
      }),
    );
  }

  return items
    .sort((a, b) => b.value - a.value)
    .slice(0, BREAKDOWN_MAX_ITEMS);
}

export function extractBreakdownCharts(
  breakdowns: Record<string, unknown>,
): { title: string; items: BarItem[] }[] {
  return Object.entries(breakdowns)
    .map(([key, value]) => ({
      title: BREAKDOWN_CHART_TITLES[key] ?? formatSummaryLabel(key),
      items: breakdownSeries(value),
    }))
    .filter((chart) => chart.items.length > 0);
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
