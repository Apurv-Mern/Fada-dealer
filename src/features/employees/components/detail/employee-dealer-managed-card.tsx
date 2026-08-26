"use client";

import {
  Award,
  Briefcase,
  Building2,
  Calendar,
  GitBranch,
  Mail,
  Phone,
  Pencil,
  UserRound,
} from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { EmployeeDetail } from "@/features/employees/types";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function FieldRow({
  icon: Icon,
  label,
  value,
  verified,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  verified?: boolean;
  iconClassName?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${iconClassName ?? "bg-[var(--color-muted)] text-[var(--color-text-muted)]"}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="break-words text-sm font-semibold text-[var(--color-heading)]">
            {value || "—"}
          </p>
          {verified ? (
            <Badge variant="success" className="gap-1">
              Verified
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmployeeDealerManagedCard({
  employee,
  onEdit,
}: {
  employee: EmployeeDetail;
  onEdit: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Employment & contact</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldRow
            icon={UserRound}
            label="Full name"
            value={employee.name || "—"}
            iconClassName="bg-violet-50 text-violet-600"
          />
          <FieldRow
            icon={Mail}
            label="Email address"
            value={employee.email || "—"}
            verified={employee.isEmailVerified}
            iconClassName="bg-red-50 text-red-500"
          />
          <FieldRow
            icon={Phone}
            label="Mobile number"
            value={employee.phone || "—"}
            verified={employee.isPhoneVerified}
            iconClassName="bg-amber-50 text-amber-600"
          />
          <FieldRow
            icon={Building2}
            label="Department"
            value={employee.departmentName || "—"}
            iconClassName="bg-violet-50 text-violet-600"
          />
          <FieldRow
            icon={Briefcase}
            label="Designation"
            value={
              employee.designation && employee.designation !== "—"
                ? employee.designation
                : "—"
            }
            iconClassName="bg-orange-50 text-orange-600"
          />
          <FieldRow
            icon={Calendar}
            label="Joining date"
            value={formatDate(employee.joinedDate)}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <FieldRow
            icon={GitBranch}
            label="Outlet"
            value={employee.branch || "—"}
            iconClassName="bg-sky-50 text-sky-600"
          />
          <FieldRow
            icon={Award}
            label="FADA score"
            value={String(employee.fadaScore ?? 0)}
            iconClassName="bg-slate-100 text-slate-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}
