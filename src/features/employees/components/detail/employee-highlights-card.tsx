"use client";

import { Card, CardContent, CardHeader, CardTitle, ScoreBar, Badge } from "@/components/ui";
import { statusBadge } from "@/features/employees/components/employees-table";
import type { EmployeeDetail } from "@/features/employees/types";

export function EmployeeHighlightsCard({ employee }: { employee: EmployeeDetail }) {
  const verificationLabel =
    employee.isKycCompleted === true
      ? "Verified"
      : employee.isKycCompleted === false
        ? "Pending"
        : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Highlights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            FADA Score
          </p>
          <div className="mt-2">
            <ScoreBar score={employee.fadaScore} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Verification
            </p>
            <div className="mt-1.5">
              <Badge
                variant={
                  employee.isKycCompleted === true
                    ? "success"
                    : employee.isKycCompleted === false
                      ? "warning"
                      : "muted"
                }
              >
                {verificationLabel}
              </Badge>
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Account status
            </p>
            <div className="mt-1.5">
              <Badge variant={statusBadge[employee.status]}>{employee.status}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
