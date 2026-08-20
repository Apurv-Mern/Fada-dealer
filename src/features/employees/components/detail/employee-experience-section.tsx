"use client";

import { Briefcase } from "lucide-react";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { EmployeeDetail } from "@/features/employees/types";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(startDate?: string, endDate?: string, isCurrent?: boolean) {
  const start = formatDate(startDate);
  if (!start && !endDate && !isCurrent) return "";
  const end = isCurrent || !endDate ? "Present" : formatDate(endDate);
  if (!start) return end;
  return `${start} – ${end}`;
}

export function EmployeeExperienceSection({
  employee,
}: {
  employee: EmployeeDetail;
}) {
  const experiences = employee.experiences ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experience</CardTitle>
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No employment history available yet.
          </p>
        ) : (
          <ul className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {experiences.map((exp) => {
              const range = formatDateRange(
                exp.startDate,
                exp.endDate,
                exp.isCurrent,
              );
              return (
                <li key={exp.id} className="flex gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-muted)] text-[var(--color-text-muted)]">
                    <Briefcase className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--color-heading)]">
                        {exp.title || "—"}
                      </p>
                      {exp.isCurrent ? (
                        <Badge variant="success">Current</Badge>
                      ) : null}
                    </div>
                    {exp.subtitle ? (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {exp.subtitle}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {exp.company}
                      {exp.employmentType
                        ? ` · ${exp.employmentType.replace(/-/g, " ")}`
                        : ""}
                    </p>
                    {range ? (
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                        {range}
                      </p>
                    ) : null}
                    {exp.highlights ? (
                      <p className="mt-1 text-xs text-[var(--color-text)]">
                        {exp.highlights}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
