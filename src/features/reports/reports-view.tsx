"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Download } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  Pagination,
  Skeleton,
  toast,
} from "@/components/ui";
import { exportReport } from "@/features/reports/api";
import {
  hasBreakdownData,
  ReportsBreakdowns,
} from "@/features/reports/components/reports-breakdowns";
import { ReportsSummary } from "@/features/reports/components/reports-summary";
import { ReportsTable } from "@/features/reports/components/reports-table";
import { ReportsTabNav } from "@/features/reports/components/reports-tab-nav";
import { ReportsTabs } from "@/features/reports/components/reports-tabs";
import { ReportsToolbar } from "@/features/reports/components/reports-toolbar";
import {
  reportExportParams,
  sanitizeReportQueryForKey,
} from "@/features/reports/map-report";
import { buildReportsSearchParams } from "@/features/reports/search-params";
import type {
  DealerReportKey,
  ReportExportFormat,
  ReportFilterField,
  ReportFiltersMetadata,
  ReportResult,
  ReportUrlQuery,
} from "@/features/reports/types";
import { emptyReportUrlQuery } from "@/features/reports/types";

export type ReportsViewProps = {
  filters: ReportFiltersMetadata;
  report: ReportResult | null;
  reportKey: DealerReportKey;
  query: ReportUrlQuery;
  isRefreshing: boolean;
};

const REPORT_PAGE_SIZE_OPTIONS = [
  { label: "25 / page", value: "25" },
  { label: "50 / page", value: "50" },
  { label: "100 / page", value: "100" },
  { label: "200 / page", value: "200" },
];

const FILTER_DRAFT_KEYS = [
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
] as const satisfies readonly (keyof ReportUrlQuery)[];

function hasPendingFilterDraft(
  draft: ReportUrlQuery,
  applied: ReportUrlQuery,
): boolean {
  return FILTER_DRAFT_KEYS.some((key) => draft[key] !== applied[key]);
}

function formatMetaPeriod(period: Record<string, unknown> | null | undefined): string {
  if (!period) return "";
  const from =
    (typeof period.fromDate === "string" && period.fromDate) ||
    (typeof period.from === "string" && period.from) ||
    "";
  const to =
    (typeof period.toDate === "string" && period.toDate) ||
    (typeof period.to === "string" && period.to) ||
    "";
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `To ${to}`;
  return "";
}

export function ReportsView({
  filters,
  report,
  reportKey,
  query,
  isRefreshing,
}: ReportsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null);
  const [filterDraft, setFilterDraft] = useState<ReportUrlQuery>(query);

  useEffect(() => {
    setFilterDraft(query);
  }, [query]);

  const syncUrl = useCallback(
    (nextKey: DealerReportKey, nextQuery: ReportUrlQuery) => {
      const params = buildReportsSearchParams(nextKey, nextQuery);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const reportIndex = filters.reports.findIndex((item) => item.key === reportKey);
  const activeReport =
    reportIndex >= 0 ? filters.reports[reportIndex] : null;
  const title = report?.meta.reportName || activeReport?.name || "Report";
  const reportLabel = activeReport?.name || title;

  const handleTabChange = (key: DealerReportKey) => {
    const sanitized = sanitizeReportQueryForKey(key, query);
    setFilterDraft((prev) => sanitizeReportQueryForKey(key, prev));
    syncUrl(key, { ...sanitized, page: 1 });
  };

  const handlePrev = () => {
    const prev = filters.reports[reportIndex - 1];
    if (prev) handleTabChange(prev.key);
  };

  const handleNext = () => {
    const next = filters.reports[reportIndex + 1];
    if (next) handleTabChange(next.key);
  };

  const handleApplyFilters = () => {
    const sanitized = sanitizeReportQueryForKey(reportKey, {
      ...filterDraft,
      page: 1,
    });
    setFilterDraft(sanitized);
    syncUrl(reportKey, sanitized);
  };

  const handleClearFilters = () => {
    const cleared = {
      ...emptyReportUrlQuery(query.pageSize),
      page: 1,
      pageSize: query.pageSize,
    };
    setFilterDraft(cleared);
    syncUrl(reportKey, cleared);
  };

  const handleRemoveChip = (key: ReportFilterField) => {
    const next = { ...query, [key]: "", page: 1 };
    setFilterDraft((prev) => ({ ...prev, [key]: "" }));
    syncUrl(reportKey, next);
  };

  const handleExport = async (format: ReportExportFormat) => {
    if (isRefreshing) {
      toast.error("Wait for the report to finish loading before exporting.");
      return;
    }

    if (!report) {
      toast.error("No report data to export yet.");
      return;
    }

    if (hasPendingFilterDraft(filterDraft, query)) {
      toast.error("Apply filters first so the export matches the report on screen.");
      return;
    }

    setExporting(format);
    try {
      await exportReport(
        reportKey,
        reportExportParams(reportKey, query),
        format,
      );
      toast.success(`${reportLabel} exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : `Could not export ${reportLabel}.`,
      );
    } finally {
      setExporting(null);
    }
  };

  const exportDisabled =
    Boolean(exporting) || isRefreshing || !report || hasPendingFilterDraft(filterDraft, query);

  const description =
    activeReport?.description ||
    "Filter, generate, and export dealer-scoped employee reports.";
  const periodLabel = formatMetaPeriod(report?.meta.period);
  const hasInsights = report ? hasBreakdownData(report.breakdowns) : false;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Operational reports for employees and adoption across your dealership."
        actions={
          <DropdownMenu
            trigger={
              <Button
                variant="outline"
                disabled={exportDisabled}
                isLoading={Boolean(exporting)}
                title={
                  hasPendingFilterDraft(filterDraft, query)
                    ? "Apply filters before exporting"
                    : undefined
                }
              >
                <Download className="size-4" aria-hidden />
                Export
                <ChevronDown className="size-4 opacity-60" aria-hidden />
              </Button>
            }
          >
            <DropdownMenuLabel>
              Export {activeReport?.name || title}
            </DropdownMenuLabel>
            <DropdownMenuItem
              disabled={exportDisabled}
              onSelect={() => void handleExport("xlsx")}
            >
              Export Excel
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={exportDisabled}
              onSelect={() => void handleExport("pdf")}
            >
              Export PDF
            </DropdownMenuItem>
          </DropdownMenu>
        }
      />

      <ReportsTabs
        reports={filters.reports}
        activeKey={reportKey}
        onChange={handleTabChange}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 text-sm text-[var(--color-text-muted)]">
          {title}
          {description ? ` — ${description}` : null}
        </p>
        <ReportsTabNav
          onPrev={handlePrev}
          onNext={handleNext}
          canPrev={reportIndex > 0}
          canNext={
            reportIndex >= 0 && reportIndex < filters.reports.length - 1
          }
        />
      </div>

      <ReportsToolbar
        reportKey={reportKey}
        applied={query}
        draft={filterDraft}
        filterOptions={filters}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        onDraftChange={(patch) =>
          setFilterDraft((prev) => ({ ...prev, ...patch }))
        }
        onApply={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRemoveChip={handleRemoveChip}
      />

      {report?.meta.generatedAt || periodLabel ? (
        <p className="-mt-2 mb-4 text-xs text-[var(--color-text-muted)]">
          {report?.meta.generatedAt
            ? `Generated ${new Date(report.meta.generatedAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}`
            : null}
          {report?.meta.generatedAt && periodLabel ? " · " : null}
          {periodLabel ? `Period ${periodLabel}` : null}
        </p>
      ) : null}

      {isRefreshing && report ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : report ? (
        <ReportsSummary summaryScalars={report.summaryScalars} />
      ) : null}

      {isRefreshing && report ? (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : report ? (
        <ReportsBreakdowns breakdowns={report.breakdowns} />
      ) : null}

      {report ? (
        <ReportsTable
          rows={report.rows}
          total={report.total}
          hasInsights={hasInsights}
          isRefreshing={isRefreshing}
        />
      ) : null}

      {report && report.total > query.pageSize ? (
        <div className="mt-4">
          <Pagination
            page={query.page}
            pageSize={query.pageSize}
            total={report.total}
            onPageChange={(page) => syncUrl(reportKey, { ...query, page })}
            onPageSizeChange={(pageSize) =>
              syncUrl(reportKey, { ...query, pageSize, page: 1 })
            }
            pageSizeOptions={REPORT_PAGE_SIZE_OPTIONS}
          />
        </div>
      ) : null}
    </div>
  );
}
