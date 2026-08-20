"use client";

import { Select } from "@/components/ui";
import type {
  EmploymentRequestFilterOptions,
  EmploymentRequestKind,
  EmploymentRequestStatus,
  EmploymentRequestTypeFilter,
} from "@/features/employment-requests/types";

const TYPE_OPTIONS: { label: string; value: EmploymentRequestKind }[] = [
  { label: "Join", value: "Join" },
  { label: "Exit", value: "Exit" },
];

const STATUS_OPTIONS: { label: string; value: EmploymentRequestStatus }[] = [
  { label: "Pending", value: "Pending" },
  { label: "Accepted", value: "Accepted" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "In Review", value: "In Review" },
];

export type EmploymentRequestsFiltersProps = {
  type: EmploymentRequestTypeFilter;
  status: EmploymentRequestStatus | "";
  branchId: string;
  filterOptions: EmploymentRequestFilterOptions;
  onTypeChange: (value: EmploymentRequestTypeFilter) => void;
  onStatusChange: (value: EmploymentRequestStatus | "") => void;
  onBranchChange: (value: string) => void;
};

export function EmploymentRequestsFilters({
  type,
  status,
  branchId,
  filterOptions,
  onTypeChange,
  onStatusChange,
  onBranchChange,
}: EmploymentRequestsFiltersProps) {
  return (
    <>
      <Select
        aria-label="Request type filter"
        placeholder="All Types"
        value={type}
        onChange={(value) =>
          onTypeChange(value as EmploymentRequestTypeFilter)
        }
        options={TYPE_OPTIONS}
        className="w-full"
      />
      <Select
        aria-label="Status filter"
        placeholder="All Status"
        value={status}
        onChange={(value) =>
          onStatusChange(value as EmploymentRequestStatus | "")
        }
        options={STATUS_OPTIONS}
        className="w-full"
      />
      <Select
        aria-label="Branch filter"
        placeholder="All Branches"
        value={branchId}
        onChange={onBranchChange}
        options={filterOptions.branches}
        className="w-full"
      />
    </>
  );
}
