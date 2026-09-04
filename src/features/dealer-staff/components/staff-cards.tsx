"use client";

import { Badge, Skeleton } from "@/components/ui";
import { StaffRowActions } from "@/features/dealer-staff/components/staff-table";
import type { StaffMember } from "@/features/dealer-staff/types";

export function StaffCards({
  rows,
  loading,
  currentUserId,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  rows: StaffMember[];
  loading: boolean;
  currentUserId?: string;
  onEdit?: (member: StaffMember) => void;
  onToggleActive?: (member: StaffMember) => void;
  onDelete?: (member: StaffMember) => void;
}) {
  return (
    <div className="md:hidden">
      {loading ? (
        <div className="space-y-3 px-5 py-4" aria-busy>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
          No staff members found. Add a staff member to grant portal access.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-start justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-heading)]">
                  {row.name}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {row.email}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {row.role.name}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <Badge variant={row.isActive ? "success" : "muted"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
                <StaffRowActions
                  member={row}
                  isSelf={currentUserId != null && row.id === currentUserId}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
