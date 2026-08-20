"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  LogOut,
  Smile,
  UserPlus,
} from "lucide-react";

import { Skeleton, StatCard } from "@/components/ui";
import type { EmploymentActionStats } from "@/features/employment-actions/types";

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function EmploymentActionsStats({
  stats,
  loading,
}: {
  stats: EmploymentActionStats;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  const mom =
    stats.vsLastMonthPct >= 0
      ? `↑ ${formatPct(stats.vsLastMonthPct)} vs last month`
      : `↓ ${formatPct(Math.abs(stats.vsLastMonthPct))} vs last month`;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      <StatCard
        label="Total Actions (This Month)"
        value={stats.totalThisMonth}
        icon={CheckCircle2}
        tone="green"
        hint={
          <span className="text-[var(--color-success)]">{mom}</span>
        }
      />
      <StatCard
        label="New Joins"
        value={stats.newJoins}
        icon={UserPlus}
        tone="blue"
        hint={`${formatPct(stats.newJoinsPct)} of actions`}
      />
      <StatCard
        label="Transfers"
        value={stats.transfers}
        icon={ArrowRightLeft}
        tone="orange"
        hint={`${formatPct(stats.transfersPct)} of actions`}
      />
      <StatCard
        label="Exits"
        value={stats.exits}
        icon={LogOut}
        tone="red"
        hint={`${formatPct(stats.exitsPct)} of actions`}
      />
      <StatCard
        label="Other Actions"
        value={stats.other}
        icon={Smile}
        tone="purple"
        hint={`${formatPct(stats.otherPct)} of actions`}
      />
    </div>
  );
}
