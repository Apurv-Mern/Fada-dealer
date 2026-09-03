"use client";

import { DateRangeField } from "@/features/employment-actions/components/date-range-field";

export function DashboardWelcomeHeader({
  userName,
  startDate,
  endDate,
  onDateRangeChange,
}: {
  userName: string;
  startDate: string;
  endDate: string;
  onDateRangeChange: (next: { from: string; to: string }) => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-heading)] sm:text-3xl">
          Welcome back, {userName}
        </h1>
      </div>
      <DateRangeField
        from={startDate}
        to={endDate}
        onChange={onDateRangeChange}
        className="w-full sm:w-auto sm:min-w-[240px]"
      />
    </div>
  );
}
