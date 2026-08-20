import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui";

export function EmploymentRequestsSkeleton() {
  return (
    <div aria-busy aria-label="Loading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mb-6 flex gap-4 overflow-hidden border-b border-[var(--color-border)] pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-8 w-28 shrink-0" />
        ))}
      </div>
      <PageSkeleton hideHeader stats={4} showTable />
    </div>
  );
}
