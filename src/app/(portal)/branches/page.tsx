"use client";

import { useCallback } from "react";

import { SectionError } from "@/components/layout/section-error";
import { getBranchDashboard } from "@/features/branches/api";
import { BranchesSkeleton } from "@/features/branches/branches-skeleton";
import { BranchesView } from "@/features/branches/branches-view";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

export default function BranchesPage() {
  const loader = useCallback(() => getBranchDashboard(), []);
  const { data, error, loading, retry } = useAsyncResource({
    key: "branch-dashboard",
    loader,
  });

  if (loading && !data) {
    return <BranchesSkeleton />;
  }

  if (error || !data) {
    return (
      <SectionError
        description={error ?? "Couldn't load branches."}
        onRetry={retry}
      />
    );
  }

  return <BranchesView dashboard={data} onRefresh={retry} />;
}
