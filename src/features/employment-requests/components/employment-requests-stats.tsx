"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  XCircle,
} from "lucide-react";

import { Skeleton, StatCard } from "@/components/ui";
import type { EmploymentRequestStats } from "@/features/employment-requests/types";

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function EmploymentRequestsStats({
  stats,
  loading,
  typeLabel = "Across all types",
}: {
  stats: EmploymentRequestStats;
  loading: boolean;
  typeLabel?: string;
}) {
  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Requests"
        value={stats.total}
        icon={ClipboardList}
        tone="blue"
        hint={typeLabel}
      />
      <StatCard
        label="Pending"
        value={stats.pending}
        icon={Clock3}
        tone="yellow"
        hint={formatPct(stats.pendingPct)}
      />
      <StatCard
        label="Approved"
        value={stats.approved}
        icon={CheckCircle2}
        tone="green"
        hint={formatPct(stats.approvedPct)}
      />
      <StatCard
        label="Rejected"
        value={stats.rejected}
        icon={XCircle}
        tone="red"
        hint={formatPct(stats.rejectedPct)}
      />
    </div>
  );
}
