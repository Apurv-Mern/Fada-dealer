import { PageSkeleton } from "@/components/layout/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function BranchesSkeleton() {
  return (
    <div aria-busy aria-label="Loading branches">
      <PageSkeleton stats={4} showTable showCharts />
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Skeleton className="mb-4 h-5 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}
