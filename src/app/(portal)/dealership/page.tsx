"use client";

import { useCallback } from "react";

import { SectionError } from "@/components/layout/section-error";
import { getDealershipPageData } from "@/features/dealership/api";
import { DealershipSkeleton } from "@/features/dealership/dealership-skeleton";
import { DealershipView } from "@/features/dealership/dealership-view";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

export default function DealershipPage() {
  const loader = useCallback(() => getDealershipPageData(), []);
  const { data, error, loading, retry } = useAsyncResource({
    key: "dealership",
    loader,
  });

  if (loading && !data) {
    return <DealershipSkeleton />;
  }

  if (error || !data) {
    return (
      <SectionError
        description={error ?? "Couldn't load company profile."}
        onRetry={retry}
      />
    );
  }

  return <DealershipView data={data} onRefresh={retry} />;
}
