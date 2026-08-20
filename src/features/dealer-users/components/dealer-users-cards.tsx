"use client";

import { Badge, Skeleton } from "@/components/ui";
import { DealerUserRowActions } from "@/features/dealer-users/components/dealer-users-table";
import {
  ROLE_LABELS,
  formatLastLogin,
  type DealerUser,
} from "@/features/dealer-users/types";

export function DealerUsersCards({
  rows,
  loading,
  activeAdminCount,
  onEdit,
  onDeactivate,
}: {
  rows: DealerUser[];
  loading: boolean;
  activeAdminCount: number;
  onEdit?: (user: DealerUser) => void;
  onDeactivate?: (user: DealerUser) => void;
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
          No users found. Invite a user to give portal access.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-[var(--color-heading)]">
                  {row.name}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {row.email}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {ROLE_LABELS[row.role]} · Last login {formatLastLogin(row.lastLoginAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <Badge variant={row.isActive ? "success" : "muted"}>
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
                <DealerUserRowActions
                  user={row}
                  disableDeactivate={
                    row.role === "dealer_admin" &&
                    row.isActive &&
                    activeAdminCount <= 1
                  }
                  onEdit={onEdit}
                  onDeactivate={onDeactivate}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
