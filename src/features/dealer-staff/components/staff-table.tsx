"use client";

import { useMemo } from "react";
import { Pencil, Trash2, UserMinus, UserPlus, Users } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  Tooltip,
} from "@/components/ui";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import type { StaffMember } from "@/features/dealer-staff/types";

export function StaffRowActions({
  member,
  isSelf,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  member: StaffMember;
  isSelf?: boolean;
  onEdit?: (member: StaffMember) => void;
  onToggleActive?: (member: StaffMember) => void;
  onDelete?: (member: StaffMember) => void;
}) {
  const { has } = usePermissions();
  const canEdit = has(PERMISSION.staffEdit) && !isSelf;
  const canDelete = has(PERMISSION.staffDelete) && !isSelf;
  const canToggle = has(PERMISSION.staffEdit) && !isSelf;

  return (
    <div className="flex shrink-0 justify-end gap-1">
      {canEdit ? (
        <Tooltip content="Edit staff member">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${member.name}`}
            onClick={() => onEdit?.(member)}
          >
            <Pencil />
          </Button>
        </Tooltip>
      ) : null}
      {member.isActive ? (
        canToggle ? (
          <Tooltip content="Deactivate staff member">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Deactivate ${member.name}`}
              onClick={() => onToggleActive?.(member)}
            >
              <UserMinus />
            </Button>
          </Tooltip>
        ) : null
      ) : canToggle ? (
        <Tooltip content="Reactivate staff member">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Reactivate ${member.name}`}
            onClick={() => onToggleActive?.(member)}
          >
            <UserPlus />
          </Button>
        </Tooltip>
      ) : null}
      {canDelete ? (
        <Tooltip content="Delete staff member">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${member.name}`}
            onClick={() => onDelete?.(member)}
          >
            <Trash2 />
          </Button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function StaffTable({
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
  const columns = useMemo<DataTableColumn<StaffMember>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        headerClassName: "w-[20%]",
        className: "max-w-0 overflow-hidden font-semibold",
        cell: (row) => (
          <span className="block truncate" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        id: "email",
        header: "Email",
        headerClassName: "w-[22%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => (
          <span className="block truncate" title={row.email}>
            {row.email}
          </span>
        ),
      },
      {
        id: "phone",
        header: "Phone",
        headerClassName: "w-[12%]",
        cell: (row) => row.phone || "—",
      },
      {
        id: "role",
        header: "Role",
        headerClassName: "w-[14%]",
        cell: (row) => row.role.name,
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
        id: "createdAt",
        header: "Created",
        headerClassName: "w-[10%]",
        cell: (row) => row.createdAt?.slice(0, 10) ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "w-[12%] text-right",
        className: "text-right",
        cell: (row) => (
          <StaffRowActions
            member={row}
            isSelf={currentUserId != null && row.id === currentUserId}
            onEdit={onEdit}
            onToggleActive={onToggleActive}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [currentUserId, onDelete, onEdit, onToggleActive],
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
          title: "No staff members found",
          description: "Add a staff member to grant portal access.",
        }}
      />
    </div>
  );
}
