"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button, StatCard } from "@/components/ui";
import { formatScalarDisplay, formatSummaryLabel } from "@/features/reports/map-report";
import type { ReportScalar } from "@/features/reports/types";

const SUMMARY_TONES = ["blue", "green", "orange", "purple"] as const;
const SUMMARY_ICONS: LucideIcon[] = [Users, TrendingUp, BarChart3, Users];
const PRIMARY_METRIC_COUNT = 6;

export type ReportsSummaryProps = {
  summaryScalars: Record<string, ReportScalar>;
};

export function ReportsSummary({ summaryScalars }: ReportsSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(summaryScalars).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  if (entries.length === 0) return null;

  const primary = entries.slice(0, PRIMARY_METRIC_COUNT);
  const extra = entries.slice(PRIMARY_METRIC_COUNT);
  const visible = expanded ? entries : primary;

  return (
    <div className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visible.map(([key, value], index) => (
          <StatCard
            key={key}
            label={formatSummaryLabel(key)}
            value={formatScalarDisplay(key, value)}
            icon={SUMMARY_ICONS[index % SUMMARY_ICONS.length] ?? Users}
            tone={SUMMARY_TONES[index % SUMMARY_TONES.length]}
            coloredValue
          />
        ))}
      </div>
      {extra.length > 0 ? (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? (
              <>
                <ChevronUp className="size-4" aria-hidden />
                Show fewer metrics
              </>
            ) : (
              <>
                <ChevronDown className="size-4" aria-hidden />
                Show {extra.length} more metrics
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
