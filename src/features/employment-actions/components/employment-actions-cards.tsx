"use client";

import { FileText } from "lucide-react";

import { Badge, Skeleton } from "@/components/ui";
import {
  EmploymentActionRowActions,
  actionStatusBadge,
} from "@/features/employment-actions/components/employment-actions-table";
import type { EmploymentAction } from "@/features/employment-actions/types";
import { formatDisplayDate } from "@/features/employment-actions/types";

export function EmploymentActionsCards({
  rows,
  loading,
  onView,
}: {
  rows: EmploymentAction[];
  loading: boolean;
  onView?: (action: EmploymentAction) => void;
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
          No actions match your filters.
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
                  <Badge variant={actionStatusBadge[row.status]}>
                    {row.status}
                  </Badge>
                  <EmploymentActionRowActions action={row} onView={onView} />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {row.actionType} · {row.branchName || "—"} ·{" "}
                {row.actionDate && row.actionDate !== "—"
                  ? formatDisplayDate(row.actionDate)
                  : "—"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                {row.actionDetails || "—"}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <FileText className="size-3.5" aria-hidden />
                {row.documentCount} doc{row.documentCount === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
