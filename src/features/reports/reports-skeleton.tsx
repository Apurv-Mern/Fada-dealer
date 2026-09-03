import { Skeleton } from "@/components/ui";
import { ReportsTabsSkeleton } from "@/features/reports/components/reports-tabs";

export function ReportsSkeleton() {
  return (
    <div aria-busy aria-label="Loading reports">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <div className="flex justify-end gap-2 pt-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <ReportsTabsSkeleton />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="mt-3 h-10 w-28" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
