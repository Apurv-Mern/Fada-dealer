"use client";

import { Building2, TrendingUp, UserCheck, Users } from "lucide-react";

import { StatCard } from "@/components/ui";
import type { BranchStats } from "@/features/branches/types";

export function BranchesStats({ stats }: { stats: BranchStats }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Branches"
        value={stats.totalBranches}
        icon={Building2}
        tone="orange"
        hint="Across 2 locations"
      />
      <StatCard
        label="Active Branches"
        value={stats.activeBranches}
        icon={Building2}
        tone="green"
        hint="100% operational"
      />
      <StatCard
        label="Total Employees"
        value={stats.totalEmployees}
        icon={Users}
        tone="blue"
        hint={
          <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
            <TrendingUp className="size-3" />
            +8.2% vs last month
          </span>
        }
      />
      <StatCard
        label="Avg FADA Score"
        value={stats.avgFadaScore}
        icon={UserCheck}
        tone="purple"
        hint="Out of 1000"
      />
    </div>
  );
}
