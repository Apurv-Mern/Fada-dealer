"use client";

import { Building2, UserCheck, Users } from "lucide-react";

import { StatCard } from "@/components/ui";
import type { BranchStats } from "@/features/branches/types";

export function BranchesStats({ stats }: { stats: BranchStats }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Outlets"
        value={stats.totalBranches}
        icon={Building2}
        tone="orange"
      />
      <StatCard
        label="Active Outlets"
        value={stats.activeBranches}
        icon={Building2}
        tone="green"
      />
      <StatCard
        label="Total Employees"
        value={stats.totalEmployees}
        icon={Users}
        tone="blue"
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
