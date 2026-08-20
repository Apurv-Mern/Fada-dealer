"use client";

import { Badge, Skeleton } from "@/components/ui";
import {
  EmploymentRequestRowActions,
  requestStatusBadge,
} from "@/features/employment-requests/components/employment-requests-table";
import type { EmploymentRequest } from "@/features/employment-requests/types";

export function EmploymentRequestsCards({
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
  return (
    <div className="md:hidden">
      {loading ? (
        <div className="space-y-3 px-5 py-4" aria-busy>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          No requests match your filters.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <li key={row.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-heading)]">
                    {row.employeeName || "—"}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {row.fadaId || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-1">
                  <Badge variant={requestStatusBadge[row.status]}>
                    {row.status}
                  </Badge>
                  <EmploymentRequestRowActions
                    request={row}
                    onApprove={onApprove}
                    onReject={onReject}
                    onView={onView}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {row.requestType} · {row.fromTo || "—"} ·{" "}
                {row.requestedAt || "—"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
