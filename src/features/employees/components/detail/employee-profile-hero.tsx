"use client";

import { MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Avatar, Badge } from "@/components/ui";
import type { EmployeeDetail } from "@/features/employees/types";
import { statusBadge } from "@/features/employees/components/employees-table";
import { cn } from "@/lib/utils/cn";

export function EmployeeProfileHero({
  employee,
  dealershipName,
}: {
  employee: EmployeeDetail;
  dealershipName: string;
}) {
  const verificationPending = employee.isKycCompleted === false;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div
        className="relative px-4 pb-6 pt-4 sm:px-6"
        style={{
          background:
            "linear-gradient(90deg, #1e3a5f 0%, #c45c26 100%)",
        }}
      >
        <div className="flex justify-end">
          <p className="text-xs font-medium text-white/80 sm:text-sm">
            FADA ID – {employee.fadaId}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar
              name={employee.name}
              src={employee.profilePictureUrl ?? null}
              size="xl"
              className="mx-auto shrink-0 ring-4 ring-white/20 sm:mx-0"
            />
            <div className="min-w-0 text-center sm:text-left">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">
                {employee.name}
              </h1>
              <p className="mt-0.5 text-sm text-white/85">
                {employee.designation !== "—" ? employee.designation : "Employee"}
              </p>
              <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-sm text-white/80 sm:justify-start">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{dealershipName || employee.branch}</span>
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {verificationPending ? (
                  <Badge variant="warning">Pending</Badge>
                ) : null}
                <Badge variant={statusBadge[employee.status]}>{employee.status}</Badge>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "mx-auto flex w-full max-w-[11rem] flex-col items-center rounded-[var(--radius-md)] bg-white p-4 shadow-md lg:mx-0 lg:shrink-0",
            )}
          >
            {employee.fadaId && employee.fadaId !== "—" ? (
              <QRCodeSVG value={employee.fadaId} size={96} level="M" />
            ) : (
              <div className="flex size-24 items-center justify-center bg-[var(--color-muted)] text-xs text-[var(--color-text-muted)]">
                No QR
              </div>
            )}
            <p className="mt-2 text-xs font-semibold text-[var(--color-heading)]">
              FADA ID
            </p>
            <p className="mt-0.5 break-all text-center text-[10px] text-[var(--color-text-muted)]">
              {employee.fadaId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
