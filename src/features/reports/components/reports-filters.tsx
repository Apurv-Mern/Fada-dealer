"use client";

import { Input, Select } from "@/components/ui";
import type { ReportFiltersMetadata } from "@/features/reports/types";

export type ReportsFiltersProps = {
  fromDate: string;
  toDate: string;
  departmentId: string;
  designationId: string;
  filterOptions: ReportFiltersMetadata;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
};

export function ReportsFilters({
  fromDate,
  toDate,
  departmentId,
  designationId,
  filterOptions,
  onFromDateChange,
  onToDateChange,
  onDepartmentChange,
  onDesignationChange,
}: ReportsFiltersProps) {
  return (
    <>
      <Input
        type="date"
        aria-label="From date"
        value={fromDate}
        onChange={(event) => onFromDateChange(event.target.value)}
        className="w-full"
      />
      <Input
        type="date"
        aria-label="To date"
        value={toDate}
        onChange={(event) => onToDateChange(event.target.value)}
        className="w-full"
      />
      <Select
        aria-label="Department filter"
        placeholder="All Departments"
        value={departmentId}
        onChange={onDepartmentChange}
        options={filterOptions.departments}
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
    </>
  );
}
