"use client";

import { UserCheck, UserMinus, UserPlus, Users } from "lucide-react";

import { Skeleton, StatCard } from "@/components/ui";
import type { EmployeeStats } from "@/features/employees/types";

export function EmployeesStats({
  stats,
  loading,
}: {
  stats: EmployeeStats;
  loading: boolean;
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
        label="Total Employees"
        value={stats.total}
        icon={Users}
        tone="orange"
        hint="Across all branches"
      />
      <StatCard
        label="Active Employees"
        value={stats.active}
        icon={UserCheck}
        tone="green"
        hint="93% of workforce"
      />
      <StatCard
        label="New Joins"
        value={stats.newJoins}
        icon={UserPlus}
        tone="blue"
        hint="This month"
      />
      <StatCard
        label="Exited"
        value={stats.exited}
        icon={UserMinus}
        tone="red"
        hint="This month"
      />
    </div>
  );
}
