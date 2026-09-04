"use client";

import { useMemo } from "react";
import { Pencil, Shield, Trash2 } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  Tooltip,
} from "@/components/ui";
import { usePermissions } from "@/features/auth/permissions-context";
import type { PortalRole } from "@/features/dealer-rbac/types";

export function RolesTable({
  rows,
  loading,
  onEdit,
  onDelete,
}: {
  rows: PortalRole[];
  loading: boolean;
  onEdit?: (role: PortalRole) => void;
  onDelete?: (role: PortalRole) => void;
}) {
  const { canManageRoles } = usePermissions();

  const columns = useMemo<DataTableColumn<PortalRole>[]>(
    () => [
      {
        id: "name",
        header: "Role",
        headerClassName: "w-[24%]",
        className: "font-semibold",
        cell: (row) => row.name,
      },
      {
        id: "key",
        header: "Key",
        headerClassName: "w-[18%]",
        cell: (row) => (
          <code className="text-xs text-[var(--color-text-muted)]">{row.key}</code>
        ),
      },
      {
        id: "type",
        header: "Type",
        headerClassName: "w-[14%]",
        cell: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.isSystem ? <Badge variant="muted">System</Badge> : null}
            {row.isSuperRole ? <Badge variant="success">Super</Badge> : null}
          </div>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        headerClassName: "w-[12%]",
        cell: (row) => String(row.permissions.length),
      },
      {
        id: "status",
        header: "Status",
        headerClassName: "w-[10%]",
        cell: (row) => (
          <Badge variant={row.isActive ? "success" : "muted"}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "w-[12%] text-right",
        className: "text-right",
        cell: (row) =>
          canManageRoles ? (
            <div className="flex justify-end gap-1">
              <Tooltip content="Edit role">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => onEdit?.(row)}
                >
                  <Pencil />
                </Button>
              </Tooltip>
              {!row.isSystem ? (
                <Tooltip content="Delete role">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${row.name}`}
                    onClick={() => onDelete?.(row)}
                  >
                    <Trash2 />
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          ) : null,
      },
    ],
    [canManageRoles, onDelete, onEdit],
  );

  return (
    <div className="hidden md:block">
      <DataTable
        scrollable={false}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={loading}
        empty={{
          icon: Shield,
          title: "No roles found",
          description: "Create a custom role to assign granular permissions.",
        }}
      />
    </div>
  );
}
