import { apiFetch, apiFetchBlob, isMockMode } from "@/lib/api";
import { buildQuery, mockDelay } from "@/lib/api/parse";
import {
  buildMockReportResult,
  mockReportFilters,
} from "@/features/reports/mocks/data";
import {
  buildReportApiQuery,
  mapReportFiltersMetadata,
  mapReportResult,
  triggerBlobDownload,
} from "@/features/reports/map-report";
import type {
  DealerReportKey,
  ReportExportFormat,
  ReportFiltersMetadata,
  ReportQueryParams,
  ReportResult,
} from "@/features/reports/types";

export {
  buildReportApiQuery,
  deriveRowColumns,
  extractBreakdownCharts,
  formatCellValue,
  formatReportDate,
  formatReportLabel,
  formatScalarDisplay,
  formatSummaryLabel,
  isDateColumnKey,
  isStatusColumnKey,
  mapReportFiltersMetadata,
  mapReportResult,
  mergeBreakdownSources,
  partitionReportSummary,
  reportStatusBadgeVariant,
} from "@/features/reports/map-report";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

export async function getReportFilters(
  reportKey?: DealerReportKey,
): Promise<ReportFiltersMetadata> {
  if (isMockMode()) {
    await mockDelay();
    return mockReportFilters;
  }

  const query = buildQuery({ reportKey });
  const body = await apiFetch<unknown>(`/dealers/reports/filters${query}`);
  return mapReportFiltersMetadata(body);
}

export async function getReport(
  reportKey: DealerReportKey,
  params: ReportQueryParams = {},
): Promise<ReportResult> {
  const page = params.page ?? DEFAULT_PAGE;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  if (isMockMode()) {
    await mockDelay();
    return buildMockReportResult(reportKey);
  }

  const query = buildQuery(
    buildReportApiQuery({ ...params, page, pageSize }),
  );
  const body = await apiFetch<unknown>(
    `/dealers/reports/${encodeURIComponent(reportKey)}${query}`,
  );
  return mapReportResult(body, { page, pageSize });
}

export async function exportReport(
  reportKey: DealerReportKey,
  params: ReportQueryParams = {},
  format: ReportExportFormat = "xlsx",
): Promise<void> {
  if (isMockMode()) {
    await mockDelay(200);
    const csv = "Employee,Status\nSample,Active\n";
    triggerBlobDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `${reportKey}.csv`,
    );
    return;
  }

  const query = buildQuery(
    buildReportApiQuery({ ...params, format }, { includePagination: false }),
  );
  const { blob, filename } = await apiFetchBlob(
    `/dealers/reports/${encodeURIComponent(reportKey)}/export${query}`,
  );
  triggerBlobDownload(blob, filename);
}
