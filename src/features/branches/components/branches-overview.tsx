"use client";

import { useState } from "react";
import { Building2, Pencil, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  type DataTableColumn,
  ScoreBar,
  Select,
  Tooltip,
  toast,
} from "@/components/ui";
import { deleteOutlet } from "@/features/branches/api";
import type { Branch } from "@/features/branches/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";

function typeBadgeVariant(
  type: string,
): "info" | "purple" | "orange" | "muted" {
  if (type === "—") return "muted";
  if (type === "Service") return "purple";
  if (type === "Sales") return "info";
  return "orange";
}

const PERIOD_HINT: Record<string, string> = {
  month: "Showing this month",
  quarter: "Showing this quarter",
  year: "Showing this year",
};

function BranchRowActions({
  branch,
  onEdit,
  onDelete,
}: {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Tooltip content="Edit branch">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${branch.name}`}
          onClick={() => onEdit?.(branch)}
        >
          <Pencil />
        </Button>
      </Tooltip>
      <Tooltip content="Delete branch">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${branch.name}`}
          onClick={() => onDelete(branch)}
        >
          <Trash2 />
        </Button>
      </Tooltip>
    </div>
  );
}

export function BranchesOverviewTable({
  branches,
  period,
  onPeriodChange,
  onEdit,
  onChanged,
}: {
  branches: Branch[];
  period: string;
  onPeriodChange: (value: string) => void;
  onEdit?: (branch: Branch) => void;
  onChanged?: () => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteOutlet(pendingDelete.id);
      toast.success("Branch deleted");
      setPendingDelete(null);
      onChanged?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to delete branch"));
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<Branch>[] = [
    {
      id: "name",
      header: "Branch Name",
      headerClassName: "w-[20%]",
      className: "max-w-0 overflow-hidden font-semibold text-[var(--color-heading)]",
      cell: (row) => (
        <span className="block truncate" title={row.name}>
          {row.name}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      headerClassName: "w-[12%]",
      className: "max-w-0 overflow-hidden text-[var(--color-text-muted)]",
      cell: (row) => (
        <span className="block truncate" title={row.location}>
          {row.location}
        </span>
      ),
    },
    {
      id: "type",
      header: "Type",
      headerClassName: "w-[14%]",
      className: "max-w-0 overflow-hidden",
      cell: (row) => (
        <div className="min-w-0 max-w-full overflow-hidden">
          <Badge className="max-w-full truncate" variant={typeBadgeVariant(row.type)} title={row.type}>
            {row.type}
          </Badge>
        </div>
      ),
    },
    {
      id: "employees",
      header: "Emp.",
      headerClassName: "w-[8%]",
      className: "overflow-hidden whitespace-nowrap",
      cell: (row) => row.employees,
    },
    {
      id: "active",
      header: "Active",
      headerClassName: "w-[8%]",
      className: "overflow-hidden whitespace-nowrap",
      cell: (row) => row.active,
    },
    {
      id: "score",
      header: "FADA Score",
      headerClassName: "w-[18%]",
      className: "max-w-0 overflow-hidden",
      cell: (row) => <ScoreBar score={row.fadaScore} />,
    },
    {
      id: "status",
      header: "Status",
      headerClassName: "w-[10%]",
      className: "max-w-0 overflow-hidden",
      cell: (row) => (
        <Badge variant={row.status === "Active" ? "success" : "muted"}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "w-[10%] text-right",
      className: "text-right",
      cell: (row) => (
        <BranchRowActions
          branch={row}
          onEdit={onEdit}
          onDelete={setPendingDelete}
        />
      ),
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <div>
          <CardTitle>Branch Overview</CardTitle>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {PERIOD_HINT[period] ?? PERIOD_HINT.month}
          </p>
        </div>
        <Select
          aria-label="Period"
          options={[
            { label: "This Month", value: "month" },
            { label: "This Quarter", value: "quarter" },
            { label: "This Year", value: "year" },
          ]}
          value={period}
          onChange={onPeriodChange}
        />
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="md:hidden">
          {branches.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
              No branches yet. Add a branch to start tracking workforce
              distribution.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {branches.map((row) => (
                <li key={row.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[var(--color-heading)]">
                        {row.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {row.location}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={typeBadgeVariant(row.type)} title={row.type}>
                          {row.type}
                        </Badge>
                        <Badge
                          variant={
                            row.status === "Active" ? "success" : "muted"
                          }
                        >
                          {row.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        {row.active}/{row.employees} active employees
                      </p>
                      <div className="mt-2">
                        <ScoreBar score={row.fadaScore} />
                      </div>
                    </div>
                    <BranchRowActions
                      branch={row}
                      onEdit={onEdit}
                      onDelete={setPendingDelete}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden md:block">
          <DataTable
            scrollable={false}
            tableClassName="w-full max-w-full table-fixed [&_th]:px-2.5 [&_th]:normal-case [&_th]:tracking-normal [&_td]:px-2.5"
            columns={columns}
            rows={branches}
            getRowKey={(row) => row.id}
            empty={{
              icon: Building2,
              title: "No branches yet",
              description:
                "Add a branch to start tracking workforce distribution.",
            }}
          />
        </div>

        <ConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
          description={
            pendingDelete
              ? `Delete branch “${pendingDelete.name}”? This cannot be undone.`
              : undefined
          }
          isLoading={deleting}
          onConfirm={confirmDelete}
        />
      </CardContent>
    </Card>
  );
}
