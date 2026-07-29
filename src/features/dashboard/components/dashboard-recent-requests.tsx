"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  type DataTableColumn,
} from "@/components/ui";
import type { RecentEmploymentRequest } from "@/features/dashboard/types";

const statusVariant = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  "In Review": "info",
} as const;

export function DashboardRecentRequests({
  rows,
}: {
  rows: RecentEmploymentRequest[];
}) {
  const columns: DataTableColumn<RecentEmploymentRequest>[] = [
    {
      id: "employee",
      header: "Employee",
      className: "font-semibold text-[var(--color-heading)]",
      cell: (row) => row.employeeName,
    },
    {
      id: "type",
      header: "Type",
      cell: (row) => row.type,
    },
    {
      id: "requested",
      header: "Requested",
      className: "text-[var(--color-text-muted)]",
      cell: (row) => row.requestedAt,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
      ),
    },
    {
      id: "action",
      header: "Action",
      headerClassName: "text-right",
      className: "text-right",
      cell: () => (
        <Link
          href="/employment-actions"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Employment Requests</CardTitle>
        <Link
          href="/employment-actions"
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          empty={{
            icon: ClipboardList,
            title: "No requests yet",
            description:
              "Employment join, exit, and transfer requests will appear here.",
          }}
        />
      </CardContent>
    </Card>
  );
}
