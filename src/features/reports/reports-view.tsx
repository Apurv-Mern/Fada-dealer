"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Download } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  Pagination,
  toast,
} from "@/components/ui";
import { exportReport } from "@/features/reports/api";
import {
  hasBreakdownData,
  ReportsBreakdowns,
} from "@/features/reports/components/reports-breakdowns";
import { ReportsCatalog } from "@/features/reports/components/reports-catalog";
import { ReportsSummary } from "@/features/reports/components/reports-summary";
import { ReportsTable } from "@/features/reports/components/reports-table";
import { ReportsToolbar } from "@/features/reports/components/reports-toolbar";
import type {
  DealerReportKey,
  ReportExportFormat,
  ReportFiltersMetadata,
  ReportResult,
} from "@/features/reports/types";

export type ReportsViewProps = {
  filters: ReportFiltersMetadata;
  report: ReportResult | null;
  reportKey: DealerReportKey | "";
  query: {
    fromDate: string;
    toDate: string;
    departmentId: string;
    designationId: string;
    page: number;
    pageSize: number;
  };
  isRefreshing: boolean;
  onRefresh?: () => void;
};

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
  onRefresh,
}: ReportsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null);

  const syncUrl = useCallback(
    (next: Partial<ReportsViewProps["query"] & { key?: DealerReportKey | "" }>) => {
      const params = new URLSearchParams();
      const key = next.key !== undefined ? next.key : reportKey;
      const fromDate = next.fromDate ?? query.fromDate;
      const toDate = next.toDate ?? query.toDate;
      const departmentId = next.departmentId ?? query.departmentId;
      const designationId = next.designationId ?? query.designationId;
      const page = next.page ?? query.page;
      const pageSize = next.pageSize ?? query.pageSize;

      if (key) params.set("key", key);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      if (departmentId) params.set("departmentId", departmentId);
      if (designationId) params.set("designationId", designationId);
      if (page > 1) params.set("page", String(page));
      if (pageSize !== 10) params.set("pageSize", String(pageSize));

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, reportKey, query],
  );

  const handleSelectReport = (key: string) => {
    syncUrl({ key: key as DealerReportKey, page: 1 });
  };

  const handleBack = () => {
    router.replace(pathname, { scroll: false });
  };

  const handleExport = async (format: ReportExportFormat) => {
    if (!reportKey) return;
    setExporting(format);
    try {
      await exportReport(
        reportKey,
        {
          fromDate: query.fromDate || undefined,
          toDate: query.toDate || undefined,
          departmentId: query.departmentId || undefined,
          designationId: query.designationId || undefined,
        },
        format,
      );
      toast.success(`Report exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not export this report.",
      );
    } finally {
      setExporting(null);
    }
  };

  const handleClearFilters = () => {
    syncUrl({
      fromDate: "",
      toDate: "",
      departmentId: "",
      designationId: "",
      page: 1,
    });
  };

  const handleRemoveChip = (
    key: "fromDate" | "toDate" | "departmentId" | "designationId",
  ) => {
    syncUrl({ [key]: "", page: 1 });
  };

  if (!reportKey) {
    return (
      <div>
        <PageHeader
          title="Reports"
          description="Operational reports for employees and adoption across your dealership. Select a report to filter and export."
        />
        <ReportsCatalog reports={filters.reports} onSelect={handleSelectReport} />
      </div>
    );
  }

  const activeReport =
    filters.reports.find((item) => item.key === reportKey) ?? null;
  const title = report?.meta.reportName || activeReport?.name || "Report";
  const description =
    activeReport?.description ||
    "Filter, generate, and export dealer-scoped employee reports.";
  const periodLabel = formatMetaPeriod(report?.meta.period);
  const hasInsights = report ? hasBreakdownData(report.breakdowns) : false;

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="size-4" aria-hidden />
              All reports
            </Button>
            <DropdownMenu
              trigger={
                <Button
                  variant="outline"
                  disabled={Boolean(exporting)}
                  isLoading={Boolean(exporting)}
                >
                  <Download className="size-4" aria-hidden />
                  Export
                  <ChevronDown className="size-4 opacity-60" aria-hidden />
                </Button>
              }
            >
              <DropdownMenuItem onSelect={() => handleExport("xlsx")}>
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport("pdf")}>
                Export PDF
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        }
      />

      <ReportsToolbar
        fromDate={query.fromDate}
        toDate={query.toDate}
        departmentId={query.departmentId}
        designationId={query.designationId}
        filterOptions={filters}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        onFromDateChange={(value) => syncUrl({ fromDate: value, page: 1 })}
        onToDateChange={(value) => syncUrl({ toDate: value, page: 1 })}
        onDepartmentChange={(value) => syncUrl({ departmentId: value, page: 1 })}
        onDesignationChange={(value) =>
          syncUrl({ designationId: value, page: 1 })
        }
        onGenerate={() => onRefresh?.()}
        onClearFilters={handleClearFilters}
        onRemoveChip={handleRemoveChip}
      />

      {report ? (
        <>
          {report.meta.generatedAt || periodLabel ? (
            <p className="-mt-2 mb-4 text-xs text-[var(--color-text-muted)]">
              {report.meta.generatedAt
                ? `Generated ${new Date(report.meta.generatedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`
                : null}
              {report.meta.generatedAt && periodLabel ? " · " : null}
              {periodLabel ? `Period ${periodLabel}` : null}
            </p>
          ) : null}

          <ReportsSummary summaryScalars={report.summaryScalars} />
          <ReportsBreakdowns breakdowns={report.breakdowns} />
          <ReportsTable
            rows={report.rows}
            total={report.total}
            hasInsights={hasInsights}
            isRefreshing={isRefreshing}
          />

          {report.total > query.pageSize ? (
            <div className="mt-4">
              <Pagination
                page={query.page}
                pageSize={query.pageSize}
                total={report.total}
                onPageChange={(page) => syncUrl({ page })}
                onPageSizeChange={(pageSize) => syncUrl({ pageSize, page: 1 })}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
