import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export type PageSkeletonProps = {
  stats?: number;
  showTable?: boolean;
  showCharts?: boolean;
  className?: string;
};

export function PageSkeleton({
  stats = 4,
  showTable = true,
  showCharts = false,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn(className)} aria-busy aria-label="Loading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>

      {showTable ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full sm:w-64" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : null}

      {showCharts ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="mx-auto size-40 rounded-full" />
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
