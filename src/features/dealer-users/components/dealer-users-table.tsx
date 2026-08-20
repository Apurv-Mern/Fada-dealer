"use client";

import { useMemo } from "react";
import { Pencil, UserMinus, UserPlus, Users } from "lucide-react";

import {
  Badge,
  Button,
  DataTable,
  type DataTableColumn,
  Tooltip,
} from "@/components/ui";
import {
  ROLE_LABELS,
  formatLastLogin,
  type DealerUser,
} from "@/features/dealer-users/types";

export function DealerUserRowActions({
  user,
  disableDeactivate,
  onEdit,
  onDeactivate,
}: {
  user: DealerUser;
  disableDeactivate?: boolean;
  onEdit?: (user: DealerUser) => void;
  onDeactivate?: (user: DealerUser) => void;
}) {
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Tooltip content="Edit user">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${user.name}`}
          onClick={() => onEdit?.(user)}
        >
          <Pencil />
        </Button>
      </Tooltip>
      {user.isActive ? (
        <Tooltip
          content={
            disableDeactivate
              ? "Cannot deactivate the last company admin"
              : "Deactivate user"
          }
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Deactivate ${user.name}`}
            disabled={disableDeactivate}
            onClick={() => onDeactivate?.(user)}
          >
            <UserMinus />
          </Button>
        </Tooltip>
      ) : (
        <Tooltip content="Reactivate user">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Reactivate ${user.name}`}
            onClick={() => onEdit?.(user)}
          >
            <UserPlus />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

export function DealerUsersTable({
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

  const columns = useMemo<DataTableColumn<DealerUser>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        headerClassName: "w-[22%]",
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
        headerClassName: "w-[14%]",
        className: "max-w-0 overflow-hidden",
        cell: (row) => row.phone || "—",
      },
      {
        id: "role",
        header: "Role",
        headerClassName: "w-[14%]",
        cell: (row) => ROLE_LABELS[row.role],
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
        id: "lastLogin",
        header: "Last login",
        headerClassName: "w-[12%]",
        cell: (row) => formatLastLogin(row.lastLoginAt),
      },
      {
        id: "actions",
        header: "Actions",
        headerClassName: "w-[6%] text-right",
        className: "text-right",
        cell: (row) => (
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
        ),
      },
    ],
    [activeAdminCount, onDeactivate, onEdit],
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
          title: "No users found",
          description: "Invite a user to give portal access.",
        }}
      />
    </div>
  );
}
