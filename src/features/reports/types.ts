/** Dealer report keys from Swagger `Dealer - Reports` (D1–D5). */
export const DEALER_REPORT_KEYS = [
  "employee-master",
  "onboarding-verification",
  "employee-movement",
  "workforce-analytics",
  "adoption-compliance",
] as const;

export type DealerReportKey = (typeof DEALER_REPORT_KEYS)[number];

export function isDealerReportKey(value: string | null | undefined): value is DealerReportKey {
  if (!value) return false;
  return (DEALER_REPORT_KEYS as readonly string[]).includes(value);
}

export type ReportExportFormat = "xlsx" | "pdf";

export type ReportFilterOption = {
  label: string;
  value: string;
};

export type ReportCatalogItem = {
  key: DealerReportKey;
  name: string;
  description?: string;
};

export type ReportFiltersMetadata = {
  reports: ReportCatalogItem[];
  departments: ReportFilterOption[];
  designations: ReportFilterOption[];
};

export type ReportMeta = {
  reportKey: string;
  reportName: string;
  portal?: "admin" | "dealer";
  period?: Record<string, unknown> | null;
  filtersApplied?: Record<string, unknown>;
  generatedAt?: string;
  generatedBy?: Record<string, unknown> | null;
};

export type ReportScalar = number | string | boolean;

export type ReportResult = {
  meta: ReportMeta;
  /** Raw summary from API (kept for debugging/export context). */
  summary: Record<string, unknown>;
  /** Scalar KPI values only — safe for StatCards. */
  summaryScalars: Record<string, ReportScalar>;
  rows: Record<string, unknown>[];
  /** Merged breakdowns from API `breakdowns` + non-scalar summary fields. */
  breakdowns: Record<string, unknown>;
  total: number;
  page: number;
  pageSize: number;
};

export type ReportQueryParams = {
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  designationId?: string;
  page?: number;
  pageSize?: number;
};

export type ReportPageData = {
  filters: ReportFiltersMetadata;
  report: ReportResult | null;
};
