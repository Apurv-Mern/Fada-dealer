"use client";

import {
  BarChart3,
  ClipboardCheck,
  LineChart,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui";
import { formatReportLabel } from "@/features/reports/map-report";
import type { ReportCatalogItem } from "@/features/reports/types";
import { cn } from "@/lib/utils/cn";

const REPORT_ICONS: Record<string, LucideIcon> = {
  "employee-master": Users,
  "onboarding-verification": UserCheck,
  "employee-movement": ClipboardCheck,
  "workforce-analytics": LineChart,
  "adoption-compliance": BarChart3,
};

const REPORT_TONES = [
  "border-[var(--color-info)]/20 bg-[var(--color-info-soft)]",
  "border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]",
  "border-[var(--color-success)]/20 bg-[var(--color-success-soft)]",
  "border-[var(--color-purple)]/20 bg-[var(--color-purple-soft)]",
  "border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)]",
] as const;

export type ReportsCatalogProps = {
  reports: ReportCatalogItem[];
  onSelect: (key: string) => void;
};

export function ReportsCatalog({ reports, onSelect }: ReportsCatalogProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((report, index) => {
        const Icon = REPORT_ICONS[report.key] ?? BarChart3;
        return (
          <button
            key={report.key}
            type="button"
            onClick={() => onSelect(report.key)}
            className={cn(
              "rounded-[var(--radius-lg)] border p-5 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
              REPORT_TONES[index % REPORT_TONES.length],
            )}
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
              <Icon className="size-5" aria-hidden />
            </div>
            <p className="text-base font-semibold text-[var(--color-heading)]">
              {report.name || formatReportLabel(report.key)}
            </p>
            {report.description ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {report.description}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ReportsCatalogSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-5">
            <div className="size-10 rounded-full bg-[var(--color-muted)]" />
            <div className="h-5 w-2/3 rounded bg-[var(--color-muted)]" />
            <div className="h-4 w-full rounded bg-[var(--color-muted)]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
