"use client";

import { Building2, GitBranch, Layers } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { EmployeeDetail } from "@/features/employees/types";

function OrgRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-muted)] text-[var(--color-text-muted)]">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[var(--color-heading)]">
          {value || "—"}
        </p>
      </div>
    </li>
  );
}

export function EmployeeOrganizationCard({
  employee,
  dealershipName,
}: {
  employee: EmployeeDetail;
  dealershipName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <OrgRow
            icon={Building2}
            label="Company"
            value={employee.dealershipName || dealershipName}
          />
          <OrgRow icon={GitBranch} label="Outlet" value={employee.branch} />
          <OrgRow
            icon={Layers}
            label="Department"
            value={employee.departmentName ?? "—"}
          />
        </ul>
      </CardContent>
    </Card>
  );
}
