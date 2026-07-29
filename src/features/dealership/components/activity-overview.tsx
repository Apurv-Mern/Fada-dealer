"use client";

import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileUp,
  LogOut,
  ArrowRightLeft,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
} from "@/components/ui";
import type {
  DealershipActivity,
  DealershipActivityMetric,
} from "@/features/dealership/types";
import { cn } from "@/lib/utils/cn";

const toneStyles = {
  blue: {
    iconBg: "bg-[var(--color-info-soft)]",
    iconColor: "text-[var(--color-info)]",
  },
  orange: {
    iconBg: "bg-[var(--color-primary-soft)]",
    iconColor: "text-[var(--color-primary)]",
  },
  purple: {
    iconBg: "bg-[var(--color-purple-soft)]",
    iconColor: "text-[var(--color-purple)]",
  },
  green: {
    iconBg: "bg-[var(--color-success-soft)]",
    iconColor: "text-[var(--color-success)]",
  },
  warning: {
    iconBg: "bg-[var(--color-warning-soft)]",
    iconColor: "text-[var(--color-warning)]",
  },
} as const;

const metricIcons: Record<string, LucideIcon> = {
  joins: UserPlus,
  exits: LogOut,
  transfers: ArrowRightLeft,
  docs: FileUp,
  pending: ClipboardList,
};

const PERIOD_HINT: Record<string, string> = {
  month: "This month",
  quarter: "This quarter",
  year: "This year",
};

export function DealershipActivityOverview({
  activity,
}: {
  activity: DealershipActivity;
}) {
  const [period, setPeriod] = useState(activity.period || "month");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Overview</CardTitle>
        <div className="flex items-center gap-2">
          <CalendarDays
            className="size-4 text-[var(--color-text-muted)]"
            aria-hidden
          />
          <Select
            aria-label="Activity period"
            options={[
              { label: "This Month", value: "month" },
              { label: "This Quarter", value: "quarter" },
              { label: "This Year", value: "year" },
            ]}
            value={period}
            onChange={setPeriod}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          {activity.metrics.map((metric) => (
            <ActivityMetric key={metric.id} metric={metric} period={period} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityMetric({
  metric,
  period,
}: {
  metric: DealershipActivityMetric;
  period: string;
}) {
  const styles = toneStyles[metric.tone];
  const Icon = metricIcons[metric.id] ?? ClipboardList;

  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
          styles.iconBg,
          styles.iconColor,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">
          {metric.label}
        </p>
        <p className="mt-0.5 text-2xl font-semibold text-[var(--color-heading)]">
          {metric.value}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {PERIOD_HINT[period] ?? PERIOD_HINT.month}
        </p>
      </div>
    </div>
  );
}
