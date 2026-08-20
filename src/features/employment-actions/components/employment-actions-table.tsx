"use client";

import { useMemo } from "react";
import { Eye, FileText } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  Tooltip,
  type DataTableColumn,
} from "@/components/ui";
import type {
  EmploymentAction,
  EmploymentActionStatus,
} from "@/features/employment-actions/types";
import { formatDisplayDate } from "@/features/employment-actions/types";

export const actionStatusBadge = {
  Pending: "warning",
  Completed: "success",
  Approved: "success",
  Rejected: "danger",
  "In Review": "info",
} as const satisfies Record<
  EmploymentActionStatus,
  "warning" | "success" | "danger" | "info"
>;

export function EmploymentActionRowActions({
  action,
  onView,
}: {
  action: EmploymentAction;
  onView?: (action: EmploymentAction) => void;
}) {
  return (
    <div className="flex shrink-0 justify-end">
      <Tooltip content="View action">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${action.employeeName}`}
          onClick={() => onView?.(action)}
        >
          <Eye />
        </Button>
      </Tooltip>
    </div>
  );
}

export function EmploymentActionsTable({
  rows,
  loading,
  onView,
}: {
  rows: EmploymentAction[];
  loading: boolean;
  onView?: (action: EmploymentAction) => void;
}) {
  const columns = useMemo<DataTableColumn<EmploymentAction>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        className: "font-semibold text-[var(--color-heading)]",
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate">{row.employeeName || "—"}</p>
            <p className="text-xs font-normal text-[var(--color-text-muted)]">
              {row.fadaId || "—"}
            </p>
          </div>
        ),
      },
      {
        id: "type",
        header: "Action Type",
        cell: (row) => row.actionType,
      },
      {
        id: "details",
        header: "Action Details",
        className: "max-w-[14rem] text-[var(--color-text-muted)]",
        cell: (row) => (
          <span className="line-clamp-2">{row.actionDetails || "—"}</span>
        ),
      },
      {
        id: "branch",
        header: "Branch",
        cell: (row) => row.branchName || "—",
      },
      {
        id: "designation",
        header: "Designation",
        cell: (row) => row.designation || "—",
      },
      {
        id: "date",
        header: "Action Date",
        className: "text-[var(--color-text-muted)] whitespace-nowrap",
        cell: (row) =>
          row.actionDate && row.actionDate !== "—"
            ? formatDisplayDate(row.actionDate)
            : "—",
      },
      {
        id: "initiatedBy",
        header: "Initiated By",
        cell: (row) => row.initiatedBy || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={actionStatusBadge[row.status]}>{row.status}</Badge>
        ),
      },
      {
        id: "documents",
        header: "Documents",
        cell: (row) => (
          <span className="inline-flex items-center gap-1 text-[var(--color-text-muted)]">
            <FileText className="size-3.5" aria-hidden />
            {row.documentCount}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        cell: (row) => (
          <EmploymentActionRowActions action={row} onView={onView} />
        ),
      },
    ],
    [onView],
  );

  return (
    <div className="hidden md:block">
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        empty={{
          title: "No actions match your filters.",
        }}
      />
    </div>
  );
}
