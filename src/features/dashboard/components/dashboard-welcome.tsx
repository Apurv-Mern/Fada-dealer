"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui";

export function DashboardWelcomeHeader({
  userName,
  dateRangeLabel,
}: {
  userName: string;
  dateRangeLabel: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-heading)] sm:text-3xl">
          Welcome back, {userName}
        </h1>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full shrink-0 sm:w-auto"
        aria-label={`Date range ${dateRangeLabel}`}
      >
        <CalendarDays />
        <span className="truncate">{dateRangeLabel}</span>
      </Button>
    </div>
  );
}
