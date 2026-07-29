"use client";

import {
  Building2,
  CloudUpload,
  BarChart3,
  UserPlus,
  Zap,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  QuickActionTile,
  toast,
} from "@/components/ui";

export function DashboardQuickActions() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-[var(--color-primary)]" aria-hidden />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionTile
            label="Add Employee"
            icon={UserPlus}
            tone="blue"
            href="/employees"
          />
          <QuickActionTile
            label="Bulk Upload"
            icon={CloudUpload}
            tone="purple"
            onClick={() =>
              toast.message(
                "Bulk upload will be available when the API is ready.",
              )
            }
          />
          <QuickActionTile
            label="Manage Outlets"
            icon={Building2}
            tone="green"
            href="/branches"
          />
          <QuickActionTile
            label="View Reports"
            icon={BarChart3}
            tone="orange"
            href="/reports"
          />
        </div>
      </CardContent>
    </Card>
  );
}
