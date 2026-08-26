"use client";

import { useEffect, useState } from "react";

import { Badge, Dialog, Skeleton } from "@/components/ui";
import { getEmploymentActionDetail } from "@/features/employment-actions/api";
import { actionStatusBadge } from "@/features/employment-actions/components/employment-actions-table";
import type { EmploymentAction } from "@/features/employment-actions/types";
import { formatDisplayDate } from "@/features/employment-actions/types";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-[var(--color-heading)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export function EmploymentActionViewDialog({
  action,
  open,
  onOpenChange,
}: {
  action: EmploymentAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [detail, setDetail] = useState<EmploymentAction | null>(action);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !action) {
      setDetail(null);
      return;
    }
    setDetail(action);
    let cancelled = false;
    setLoading(true);
    void getEmploymentActionDetail(action)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch(() => {
        if (!cancelled) setDetail(action);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, action]);

  const row = detail ?? action;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Action details"
      description={row ? row.employeeName : undefined}
      className="max-w-lg"
    >
      {!row ? null : loading && !detail ? (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        <dl className="space-y-3">
          <DetailRow label="Employee" value={row.employeeName} />
          <DetailRow label="FADA ID" value={row.fadaId} />
          <DetailRow label="Mobile" value={row.mobile} />
          <DetailRow label="Action Type" value={row.actionType} />
          <DetailRow label="Details" value={row.actionDetails} />
          <DetailRow label="Outlet" value={row.branchName} />
          <DetailRow label="Designation" value={row.designation} />
          <DetailRow
            label="Action Date"
            value={
              row.actionDate && row.actionDate !== "—"
                ? formatDisplayDate(row.actionDate)
                : "—"
            }
          />
          <DetailRow label="Initiated By" value={row.initiatedBy} />
          <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm sm:grid-cols-[9rem_1fr]">
            <dt className="text-[var(--color-text-muted)]">Status</dt>
            <dd>
              <Badge variant={actionStatusBadge[row.status]}>{row.status}</Badge>
            </dd>
          </div>
          <DetailRow
            label="Documents"
            value={String(row.documentCount ?? 0)}
          />
        </dl>
      )}
    </Dialog>
  );
}
