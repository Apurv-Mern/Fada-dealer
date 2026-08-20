"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui";
import { BranchesAddDialog } from "@/features/branches/components/branches-add-dialog";
import { BranchesCharts } from "@/features/branches/components/branches-charts";
import { BranchesOverviewTable } from "@/features/branches/components/branches-overview";
import { BranchesStats } from "@/features/branches/components/branches-stats";
import type { Branch, BranchDashboard } from "@/features/branches/types";

export type BranchesHeaderProps = {
  /** When true, show Add New Branch (default for full dashboard view). */
  showAddBranch?: boolean;
  onAddBranch?: () => void;
};

export function BranchesHeader({
  showAddBranch = false,
  onAddBranch,
}: BranchesHeaderProps) {
  return (
    <PageHeader
      title="Branch Management"
      description="Configure company branches and monitor workforce distribution."
      actions={
        showAddBranch ? (
          <Button onClick={onAddBranch} className="w-full sm:w-auto">
            <Plus />
            Add New Branch
          </Button>
        ) : null
      }
    />
  );
}

export type BranchesViewProps = {
  dashboard: BranchDashboard;
  onRefresh?: () => void;
};

export function BranchesView({ dashboard, onRefresh }: BranchesViewProps) {
  const {
    stats,
    branches,
    employeesByBranch,
    branchScores,
    branchPerformance,
  } = dashboard;

  const [period, setPeriod] = useState("month");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  return (
    <div>
      <BranchesHeader
        showAddBranch
        onAddBranch={() => {
          setEditing(null);
          setAddOpen(true);
        }}
      />

      <BranchesStats stats={stats} />
      <BranchesOverviewTable
        branches={branches}
        period={period}
        onPeriodChange={setPeriod}
        onEdit={(branch) => {
          setEditing(branch);
          setAddOpen(true);
        }}
        onChanged={onRefresh}
      />
      <BranchesCharts
        totalEmployees={stats.totalEmployees}
        employeesByBranch={employeesByBranch}
        branchScores={branchScores}
        branchPerformance={branchPerformance}
      />
      <BranchesAddDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditing(null);
        }}
        branch={editing}
        onSaved={onRefresh}
      />
    </div>
  );
}
