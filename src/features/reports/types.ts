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

export const DEFAULT_REPORT_PAGE_SIZE = 50;

export type ReportFilterField =
  | "search"
  | "fromDate"
  | "toDate"
  | "departmentId"
  | "designationId"
  | "employmentStatus"
  | "fadaIdStatus"
  | "profileStatus"
  | "verificationStatus"
  | "membershipStatus"
  | "stage"
  | "eventType";

export type ReportUrlQuery = {
  search: string;
  fromDate: string;
  toDate: string;
  departmentId: string;
  designationId: string;
  employmentStatus: string;
  fadaIdStatus: string;
  profileStatus: string;
  verificationStatus: string;
  membershipStatus: string;
  stage: string;
  eventType: string;
  page: number;
  pageSize: number;
};

export function emptyReportUrlQuery(
  pageSize = DEFAULT_REPORT_PAGE_SIZE,
): ReportUrlQuery {
  return {
    search: "",
    fromDate: "",
    toDate: "",
    departmentId: "",
    designationId: "",
    employmentStatus: "",
    fadaIdStatus: "",
    profileStatus: "",
    verificationStatus: "",
    membershipStatus: "",
    stage: "",
    eventType: "",
    page: 1,
    pageSize,
  };
}

export type ReportQueryParams = {
  search?: string;
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  designationId?: string;
  employmentStatus?: string;
  fadaIdStatus?: string;
  profileStatus?: string;
  verificationStatus?: string;
  membershipStatus?: string;
  stage?: string;
  eventType?: string;
  page?: number;
  pageSize?: number;
};

export const EMPLOYMENT_STATUS_OPTIONS: ReportFilterOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
];

export const FADA_ID_STATUS_OPTIONS: ReportFilterOption[] = [
  { label: "None", value: "none" },
  { label: "Created", value: "created" },
  { label: "Active", value: "active" },
];

export const PROFILE_STATUS_OPTIONS: ReportFilterOption[] = [
  { label: "Completed", value: "completed" },
  { label: "Incomplete", value: "incomplete" },
];

export const VERIFICATION_STATUS_OPTIONS: ReportFilterOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Verified", value: "verified" },
  { label: "Rejected", value: "rejected" },
];

export const MEMBERSHIP_STATUS_OPTIONS: ReportFilterOption[] = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
];

export const EVENT_TYPE_OPTIONS: ReportFilterOption[] = [
  { label: "New joiner", value: "new_joiner" },
  { label: "Exit", value: "exit" },
  { label: "Status change", value: "status_change" },
];

export type ReportPageData = {
  filters: ReportFiltersMetadata;
  report: ReportResult | null;
};
