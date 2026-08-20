"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { EmployeeDetailPageClient } from "@/features/employees/employee-detail-page-client";
import { EmployeeDetailSkeleton } from "@/features/employees/employee-detail-skeleton";

function EmployeeDetailFromQuery() {
  const searchParams = useSearchParams();
  const id = (searchParams.get("id") ?? "").trim();
  return <EmployeeDetailPageClient id={id} />;
}

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<EmployeeDetailSkeleton />}>
      <EmployeeDetailFromQuery />
    </Suspense>
  );
}
