"use client";

import { useMemo } from "react";
import { Check, Eye, X } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  Tooltip,
  type DataTableColumn,
} from "@/components/ui";
import type {
  EmploymentRequest,
  EmploymentRequestStatus,
} from "@/features/employment-requests/types";

export const requestStatusBadge = {
  Pending: "warning",
  Accepted: "success",
  Approved: "success",
  Rejected: "danger",
  "In Review": "info",
} as const satisfies Record<
  EmploymentRequestStatus,
  "warning" | "success" | "danger" | "info"
>;

export function EmploymentRequestRowActions({
  request,
  onApprove,
  onReject,
  onView,
}: {
  request: EmploymentRequest;
  onApprove?: (request: EmploymentRequest) => void;
  onReject?: (request: EmploymentRequest) => void;
  onView?: (request: EmploymentRequest) => void;
}) {
  const showDecide = request.canDecide;
  const showView =
    request.requestType === "Join" || request.requestType === "Exit";
  const viewLabel =
    request.requestType === "Join" ? "View join request" : "View exit request";

  if (!showDecide && !showView) {
    return (
      <span className="text-sm text-[var(--color-text-muted)]">—</span>
    );
  }

  return (
    <div className="flex shrink-0 justify-end gap-1">
      {showView ? (
        <Tooltip content={viewLabel}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`View ${request.employeeName}`}
            onClick={() => onView?.(request)}
          >
            <Eye />
          </Button>
        </Tooltip>
      ) : null}
      {showDecide ? (
        <>
          <Tooltip content="Approve request">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Approve ${request.employeeName}`}
              onClick={() => onApprove?.(request)}
            >
              <Check className="text-[var(--color-success)]" />
            </Button>
          </Tooltip>
          <Tooltip content="Reject request">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Reject ${request.employeeName}`}
              onClick={() => onReject?.(request)}
            >
              <X className="text-[var(--color-danger)]" />
            </Button>
          </Tooltip>
        </>
      ) : null}
    </div>
  );
}

export function EmploymentRequestsTable({
  rows,
  loading,
  onApprove,
  onReject,
  onView,
}: {
  rows: EmploymentRequest[];
  loading: boolean;
  onApprove?: (request: EmploymentRequest) => void;
  onReject?: (request: EmploymentRequest) => void;
  onView?: (request: EmploymentRequest) => void;
}) {
  const columns = useMemo<DataTableColumn<EmploymentRequest>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        className: "font-semibold text-[var(--color-heading)]",
        cell: (row) => row.employeeName || "—",
      },
      {
        id: "fadaId",
        header: "FADA ID",
        className: "text-[var(--color-text-muted)]",
        cell: (row) => row.fadaId || "—",
      },
      {
        id: "type",
        header: "Request Type",
        cell: (row) => row.requestType,
      },
      {
        id: "fromTo",
        header: "From / To",
        className: "text-[var(--color-text-muted)]",
        cell: (row) => row.fromTo || "—",
      },
      {
        id: "date",
        header: "Request Date",
        className: "text-[var(--color-text-muted)]",
        cell: (row) => row.requestedAt || "—",
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={requestStatusBadge[row.status]}>{row.status}</Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        cell: (row) => (
          <EmploymentRequestRowActions
            request={row}
            onApprove={onApprove}
            onReject={onReject}
            onView={onView}
          />
        ),
      },
    ],
    [onApprove, onReject, onView],
  );

  return (
    <div className="hidden md:block">
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        empty={{
          title: "No requests match your filters.",
        }}
      />
    </div>
  );
}
