import { Skeleton } from "@/components/ui";

export function EmployeeDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-52 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
        </div>
        <div className="space-y-6 lg:col-span-1">
          <Skeleton className="h-36 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-44 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </div>
  );
}
