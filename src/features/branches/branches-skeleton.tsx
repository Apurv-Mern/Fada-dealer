import { PageSkeleton } from "@/components/layout/page-skeleton";

export type BranchesSkeletonProps = {
  /** When true, omit the page-header skeleton (real header already shown). */
  hideHeader?: boolean;
};

export function BranchesSkeleton({ hideHeader = false }: BranchesSkeletonProps) {
  return (
    <div aria-busy aria-label="Loading outlets">
      <PageSkeleton stats={4} showTable showCharts hideHeader={hideHeader} />
    </div>
  );
}
