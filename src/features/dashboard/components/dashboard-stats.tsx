"use client";

import { UserMinus, UserPlus, Users } from "lucide-react";

import { StatCard } from "@/components/ui";
import type { DashboardStats } from "@/features/dashboard/types";

function weekHint(delta: number) {
  const sign = delta >= 0 ? "+" : "";
  return (
    <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
      <span aria-hidden>↑</span>
      {sign}
      {delta} this week
    </span>
  );
}

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={stats.totalEmployees.label}
        value={stats.totalEmployees.value}
        icon={Users}
        tone="blue"
        coloredValue
        hint={weekHint(stats.totalEmployees.weekDelta)}
      />
      <StatCard
        label={stats.activeEmployees.label}
        value={stats.activeEmployees.value}
        icon={Users}
        tone="green"
        coloredValue
        hint={weekHint(stats.activeEmployees.weekDelta)}
      />
      <StatCard
        label={stats.newJoins.label}
        value={stats.newJoins.value}
        icon={UserPlus}
        tone="purple"
        coloredValue
        hint={weekHint(stats.newJoins.weekDelta)}
      />
      <StatCard
        label={stats.exits.label}
        value={stats.exits.value}
        icon={UserMinus}
        tone="red"
        coloredValue
        hint={weekHint(stats.exits.weekDelta)}
      />
    </div>
  );
}
