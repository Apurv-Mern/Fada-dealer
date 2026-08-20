"use client";

import { Select } from "@/components/ui";
import { DateRangeField } from "@/features/employment-actions/components/date-range-field";
import type {
  EmploymentActionFilterOptions,
  EmploymentActionStatus,
  EmploymentActionType,
  EmploymentActionTypeFilter,
} from "@/features/employment-actions/types";

const TYPE_OPTIONS: { label: string; value: EmploymentActionType }[] = [
  { label: "New Join", value: "New Join" },
  { label: "Transfer", value: "Transfer" },
  { label: "Exit", value: "Exit" },
  { label: "Other", value: "Other" },
];

const STATUS_OPTIONS: { label: string; value: EmploymentActionStatus }[] = [
  { label: "Pending", value: "Pending" },
  { label: "Completed", value: "Completed" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "In Review", value: "In Review" },
];

export type EmploymentActionsFiltersProps = {
  actionType: EmploymentActionTypeFilter;
  status: EmploymentActionStatus | "";
  branchId: string;
  from: string;
  to: string;
  filterOptions: EmploymentActionFilterOptions;
  onActionTypeChange: (value: EmploymentActionTypeFilter) => void;
  onStatusChange: (value: EmploymentActionStatus | "") => void;
  onBranchChange: (value: string) => void;
  onDateRangeChange: (next: { from: string; to: string }) => void;
  showDateRange?: boolean;
};

export function EmploymentActionsFilters({
  actionType,
  status,
  branchId,
  from,
  to,
  filterOptions,
  onActionTypeChange,
  onStatusChange,
  onBranchChange,
  onDateRangeChange,
  showDateRange = true,
}: EmploymentActionsFiltersProps) {
  return (
    <>
      <Select
        aria-label="Action type filter"
        placeholder="All Action Types"
        value={actionType}
        onChange={(value) =>
          onActionTypeChange(value as EmploymentActionTypeFilter)
        }
        options={TYPE_OPTIONS}
        className="w-full lg:w-auto lg:min-w-[140px]"
      />
      <Select
        aria-label="Branch filter"
        placeholder="All Branches"
        value={branchId}
        onChange={onBranchChange}
        options={filterOptions.branches}
        className="w-full lg:w-auto lg:min-w-[140px]"
      />
      <Select
        aria-label="Status filter"
        placeholder="All Status"
        value={status}
        onChange={(value) =>
          onStatusChange(value as EmploymentActionStatus | "")
        }
        options={STATUS_OPTIONS}
        className="w-full lg:w-auto lg:min-w-[140px]"
      />
      {showDateRange ? (
        <DateRangeField
          from={from}
          to={to}
          onChange={onDateRangeChange}
          className="w-full lg:w-auto lg:min-w-[200px]"
        />
      ) : null}
    </>
  );
}
