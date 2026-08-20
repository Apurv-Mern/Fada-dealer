"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";

import { EmptyState, buttonVariants } from "@/components/ui";
import { EmployeeDealerManagedCard } from "@/features/employees/components/detail/employee-dealer-managed-card";
import { EmployeeExperienceSection } from "@/features/employees/components/detail/employee-experience-section";
import { EmployeeEmploymentEditDialog } from "@/features/employees/components/detail/employee-employment-edit-dialog";
import { EmployeeHighlightsCard } from "@/features/employees/components/detail/employee-highlights-card";
import { EmployeeJourneySection } from "@/features/employees/components/detail/employee-journey-section";
import { EmployeeOrganizationCard } from "@/features/employees/components/detail/employee-organization-card";
import { EmployeePersonalReadonlyCard } from "@/features/employees/components/detail/employee-personal-readonly-card";
import { EmployeeProfileHero } from "@/features/employees/components/detail/employee-profile-hero";
import { useActingDealerName } from "@/features/auth/use-acting-dealer-name";
import type {
  EmployeeDetail,
  EmployeeFilterOptions,
} from "@/features/employees/types";
import { routes } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

export function EmployeeDetailView({
  employee,
  filterOptions,
  onRefresh,
}: {
  employee: EmployeeDetail;
  filterOptions: EmployeeFilterOptions;
  onRefresh?: () => void;
}) {
  const dealershipName = useActingDealerName();
  const [employmentEditOpen, setEmploymentEditOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href={routes.employees}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-heading)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Employees
        </Link>

        <EmployeeProfileHero
          employee={employee}
          dealershipName={dealershipName || employee.dealershipName || "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EmployeeDealerManagedCard
            employee={employee}
            onEdit={() => setEmploymentEditOpen(true)}
          />
          <EmployeePersonalReadonlyCard employee={employee} />
          <EmployeeExperienceSection employee={employee} />
          <EmployeeJourneySection employee={employee} />
        </div>

        <aside className="space-y-6 lg:col-span-1">
          <EmployeeHighlightsCard employee={employee} />
          <EmployeeOrganizationCard
            employee={employee}
            dealershipName={dealershipName}
          />
        </aside>
      </div>

      <EmployeeEmploymentEditDialog
        open={employmentEditOpen}
        employee={employee}
        filterOptions={filterOptions}
        onOpenChange={setEmploymentEditOpen}
        onSaved={() => onRefresh?.()}
      />
    </div>
  );
}

export function EmployeeNotFoundState() {
  return (
    <EmptyState
      icon={Users}
      title="Employee not found"
      description="This employee may have been removed or you may not have access."
      action={
        <Link
          href={routes.employees}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to employees
        </Link>
      }
    />
  );
}
