"use client";

import { REPORT_TAB_THEMES } from "@/features/reports/components/report-tab-theme";
import { formatReportLabel } from "@/features/reports/map-report";
import type { DealerReportKey, ReportCatalogItem } from "@/features/reports/types";
import { cn } from "@/lib/utils/cn";

export type ReportsTabsProps = {
  reports: ReportCatalogItem[];
  activeKey: DealerReportKey;
  onChange: (key: DealerReportKey) => void;
};

export function ReportsTabs({
  reports,
  activeKey,
  onChange,
}: ReportsTabsProps) {
  return (
    <div
      className="mb-3 flex w-full flex-wrap gap-2"
      role="tablist"
      aria-label="Report type"
    >
      {reports.map((report) => {
        const selected = report.key === activeKey;
        const theme = REPORT_TAB_THEMES[report.key];
        const Icon = theme.icon;
        const label = report.name || formatReportLabel(report.key);

        return (
          <button
            key={report.key}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "relative flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center gap-2 rounded-[var(--radius-lg)] border px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] sm:basis-auto sm:flex-none sm:px-4 lg:min-w-[10.5rem]",
              selected
                ? "border-2 pl-3.5 font-semibold shadow-md sm:pl-4"
                : "border font-normal opacity-70 hover:border-[var(--color-border)] hover:opacity-100",
            )}
            style={
              selected
                ? {
                    borderColor: theme.accentBorder,
                    backgroundColor: theme.accentSoft,
                    color: theme.accentText,
                    boxShadow: `0 0 0 2px color-mix(in srgb, ${theme.accent} 18%, transparent), var(--shadow-card)`,
                  }
                : {
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                  }
            }
            onClick={() => onChange(report.key)}
          >
            {selected ? (
              <span
                className="absolute inset-y-2 left-0 w-1 rounded-r-full"
                style={{ backgroundColor: theme.accent }}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full transition",
                selected ? "text-white" : "bg-[var(--color-muted)]",
              )}
              style={
                selected
                  ? { backgroundColor: theme.accent }
                  : { color: theme.accentText }
              }
            >
              <Icon className="size-4" aria-hidden />
            </span>

            <span className="min-w-0 truncate text-left leading-tight">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ReportsTabsSkeleton() {
  return (
    <div className="mb-3 flex w-full flex-wrap gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 min-w-[8rem] flex-1 basis-[calc(50%-0.25rem)] rounded-[var(--radius-lg)] bg-[var(--color-muted)] sm:basis-auto sm:flex-none lg:min-w-[10.5rem]"
        />
      ))}
    </div>
  );
}
