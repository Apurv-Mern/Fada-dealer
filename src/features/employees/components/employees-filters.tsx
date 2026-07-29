"use client";

import { Select } from "@/components/ui";
import type {
  EmployeeFilterOptions,
  EmployeeStatus,
} from "@/features/employees/types";

const STATUS_OPTIONS = [
  { label: "Active", value: "Active" },
  { label: "On Notice", value: "On Notice" },
  { label: "Inactive", value: "Inactive" },
];

export type EmployeesFiltersProps = {
  branchId: string;
  designationId: string;
  status: EmployeeStatus | "";
  filterOptions: EmployeeFilterOptions;
  onBranchChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
  onStatusChange: (value: EmployeeStatus | "") => void;
};

export function EmployeesFilters({
  branchId,
  designationId,
  status,
  filterOptions,
  onBranchChange,
  onDesignationChange,
  onStatusChange,
}: EmployeesFiltersProps) {
  return (
    <>
      <Select
        aria-label="Branch filter"
        placeholder="All Branches"
        value={branchId}
        onChange={onBranchChange}
        options={filterOptions.branches}
        className="w-full"
      />
      <Select
        aria-label="Designation filter"
        placeholder="All Designations"
        value={designationId}
        onChange={onDesignationChange}
        options={filterOptions.designations}
        className="w-full"
      />
      <Select
        aria-label="Status filter"
        placeholder="All Status"
        value={status}
        onChange={(value) => onStatusChange(value as EmployeeStatus | "")}
        options={STATUS_OPTIONS}
        className="w-full"
      />
    </>
  );
}
