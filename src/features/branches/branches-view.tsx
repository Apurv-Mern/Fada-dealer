"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Upload } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui";
import { BranchesAddDialog } from "@/features/branches/components/branches-add-dialog";
import { BranchesImportDialog } from "@/features/branches/components/branches-import-dialog";
import { BranchesCharts } from "@/features/branches/components/branches-charts";
import { BranchesOverviewTable } from "@/features/branches/components/branches-overview";
import { BranchesStats } from "@/features/branches/components/branches-stats";
import type { Branch, BranchDashboard } from "@/features/branches/types";

export type BranchesHeaderProps = {
  /** When true, show Add New Outlet (default for full dashboard view). */
  showAddBranch?: boolean;
  onAddBranch?: () => void;
  onImportOutlets?: () => void;
};

export function BranchesHeader({
  showAddBranch = false,
  onAddBranch,
  onImportOutlets,
}: BranchesHeaderProps) {
  return (
    <PageHeader
      title="Outlet Management"
      description="Configure company outlets and monitor workforce distribution."
      actions={
        showAddBranch ? (
          <>
            {onImportOutlets ? (
              <Button
                variant="secondary"
                onClick={onImportOutlets}
                className="w-full sm:w-auto"
              >
                <Upload />
                Import Outlets
              </Button>
            ) : null}
            <Button onClick={onAddBranch} className="w-full sm:w-auto">
              <Plus />
              Add New Outlet
            </Button>
          </>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    stats,
    branches,
    employeesByBranch,
    branchScores,
    branchPerformance,
  } = dashboard;

  const [period, setPeriod] = useState("month");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(
    () => searchParams.get("import") === "1",
  );
  const [editing, setEditing] = useState<Branch | null>(null);

  const setImportDialogOpen = useCallback(
    (open: boolean) => {
      setImportOpen(open);
      if (!open && searchParams.get("import") === "1") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("import");
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
      }
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (searchParams.get("import") === "1") {
      setImportOpen(true);
    }
  }, [searchParams]);

  return (
    <div>
      <BranchesHeader
        showAddBranch
        onImportOutlets={() => setImportDialogOpen(true)}
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
      <BranchesImportDialog
        open={importOpen}
        onOpenChange={setImportDialogOpen}
        onImported={onRefresh}
      />
    </div>
  );
}
