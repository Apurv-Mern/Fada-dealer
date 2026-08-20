"use client";

import {
  Calendar,
  Droplets,
  Fingerprint,
  MapPin,
  VenusAndMars,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
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

function ReadonlyFieldRow({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
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
        <p className="mt-0.5 break-words text-sm font-semibold text-[var(--color-heading)]">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function EmployeePersonalReadonlyCard({
  employee,
}: {
  employee: EmployeeDetail;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <ReadonlyFieldRow
            icon={Fingerprint}
            label="FADA ID"
            value={employee.fadaId || "—"}
            iconClassName="bg-[var(--color-muted)] text-[var(--color-text-muted)]"
          />
          <ReadonlyFieldRow
            icon={Calendar}
            label="Date of birth"
            value={formatDate(employee.dateOfBirth)}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
          <ReadonlyFieldRow
            icon={VenusAndMars}
            label="Gender"
            value={employee.gender || "—"}
            iconClassName="bg-orange-50 text-orange-600"
          />
          <ReadonlyFieldRow
            icon={Droplets}
            label="Blood group"
            value={employee.bloodGroup || "—"}
            iconClassName="bg-rose-50 text-rose-600"
          />
          <ReadonlyFieldRow
            icon={MapPin}
            label="Address"
            value={employee.address || employee.city || "—"}
            iconClassName="bg-lime-50 text-lime-700"
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Date of birth, gender, blood group and address are updated by the
          employee in the FADA mobile app.
        </p>
      </CardContent>
    </Card>
  );
}
