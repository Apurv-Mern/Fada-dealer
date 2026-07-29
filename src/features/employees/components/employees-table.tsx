"use client";

import { useMemo } from "react";
import { Pencil, UserMinus, Users } from "lucide-react";

import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  DataTable,
  type DataTableColumn,
  ScoreBar,
  Tooltip,
} from "@/components/ui";
import type { Employee, EmployeeStatus } from "@/features/employees/types";

const statusBadge = {
  Active: "success",
  "On Notice": "warning",
  Inactive: "muted",
} as const satisfies Record<EmployeeStatus, "success" | "warning" | "muted">;

export function EmployeeRowActions({
  employee,
  onEdit,
  onDeactivate,
}: {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onDeactivate?: (employee: Employee) => void;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Tooltip content="Edit employee">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${employee.name}`}
          onClick={() => onEdit?.(employee)}
        >
          <Pencil />
        </Button>
      </Tooltip>
      <Tooltip content="Deactivate employee">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Deactivate ${employee.name}`}
          onClick={() => onDeactivate?.(employee)}
        >
          <UserMinus />
        </Button>
      </Tooltip>
    </div>
  );
}

export function EmployeesTable({
  rows,
  selected,
  loading,
  allVisibleSelected,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDeactivate,
}: {
  rows: Employee[];
  selected: string[];
  loading: boolean;
  allVisibleSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onEdit?: (employee: Employee) => void;
  onDeactivate?: (employee: Employee) => void;
}) {
  const columns = useMemo<DataTableColumn<Employee>[]>(
    () => [
      {
        id: "select",
        header: (
          <Checkbox
            aria-label="Select all employees on page"
            checked={allVisibleSelected}
            onChange={onToggleAll}
            containerClassName="w-auto"
            className="mt-0"
          />
        ),
        headerClassName: "w-[5%]",
        className: "overflow-hidden",
        cell: (row) => (
          <Checkbox
            aria-label={`Select ${row.name}`}
            checked={selected.includes(row.id)}
            onChange={() => onToggleOne(row.id)}
            containerClassName="w-auto"
            className="mt-0"
          />
        ),
      },
      {
        id: "employee",
        header: "Employee",
        headerClassName: "w-[22%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={row.name} size="md" className="shrink-0" />
            <div className="min-w-0">
              <p
                className="truncate font-semibold text-[var(--color-heading)]"
                title={row.name}
              >
                {row.name}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]" title={row.email}>
                {row.email}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]" title={row.phone}>
                {row.phone}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "fadaId",
        header: "FADA ID",
        headerClassName: "w-[10%]",
        className: "max-w-0 overflow-hidden font-medium",
        cell: (row) => (
          <span className="block truncate" title={row.fadaId}>
            {row.fadaId}
          </span>
        ),
      },
      {
        id: "branch",
        header: "Branch",
        headerClassName: "w-[12%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <span className="block truncate" title={row.branch}>
            {row.branch}
          </span>
        ),
      },
      {
        id: "designation",
        header: "Designation",
        headerClassName: "w-[12%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <span className="block truncate" title={row.designation}>
            {row.designation}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        headerClassName: "w-[10%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <Badge variant={statusBadge[row.status]}>{row.status}</Badge>
        ),
      },
      {
        id: "score",
        header: "FADA Score",
        headerClassName: "w-[16%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => <ScoreBar score={row.fadaScore} />,
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "w-[13%] text-right",
        className: "text-right",
        cell: (row) => (
          <EmployeeRowActions
            employee={row}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
          />
        ),
      },
    ],
    [
      allVisibleSelected,
      onDeactivate,
      onEdit,
      onToggleAll,
      onToggleOne,
      selected,
    ],
  );

  return (
    <div className="hidden md:block">
      <DataTable
        scrollable={false}
        tableClassName="w-full max-w-full table-fixed [&_th]:px-2.5 [&_th]:normal-case [&_th]:tracking-normal [&_td]:px-2.5"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        empty={{
          icon: Users,
          title: "No employees found",
          description: "Try adjusting search or filters.",
        }}
      />
    </div>
  );
}

export { statusBadge };
