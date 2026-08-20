"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar, Badge, Checkbox, ScoreBar, Skeleton } from "@/components/ui";
import { routes } from "@/config/navigation";
import {
  EmployeeRowActions,
  statusBadge,
} from "@/features/employees/components/employees-table";
import type { Employee } from "@/features/employees/types";

export function EmployeesCards({
  rows,
  selected,
  loading,
  onToggleOne,
  onView,
  onEdit,
  onTransfer,
}: {
  rows: Employee[];
  selected: string[];
  loading: boolean;
  onToggleOne: (id: string) => void;
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onTransfer?: (employee: Employee) => void;
}) {
  const router = useRouter();
  const handleView =
    onView ??
    ((employee: Employee) => {
      router.push(routes.employeeDetail(employee.id));
    });
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
          No employees found. Try adjusting search or filters.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-3 px-5 py-4">
              <Checkbox
                aria-label={`Select ${row.name}`}
                checked={selected.includes(row.id)}
                onChange={() => onToggleOne(row.id)}
                containerClassName="w-auto pt-1"
                className="mt-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={row.name} size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={routes.employeeDetail(row.id)}
                        className="truncate font-semibold text-[var(--color-heading)] hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {row.fadaId}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Badge variant={statusBadge[row.status]}>{row.status}</Badge>
                    <EmployeeRowActions
                      employee={row}
                      onView={handleView}
                      onEdit={onEdit}
                      onTransfer={onTransfer}
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {row.branch} · {row.designation}
                </p>
                <div className="mt-2">
                  <ScoreBar score={row.fadaScore} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
