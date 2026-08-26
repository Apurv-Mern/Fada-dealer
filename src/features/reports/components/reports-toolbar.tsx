"use client";

import { Filter, X } from "lucide-react";

import { Badge, Button, Sheet } from "@/components/ui";
import { ReportsFilters } from "@/features/reports/components/reports-filters";
import type { ReportFiltersMetadata } from "@/features/reports/types";

export type ReportsToolbarProps = {
  fromDate: string;
  toDate: string;
  departmentId: string;
  designationId: string;
  filterOptions: ReportFiltersMetadata;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
  onGenerate: () => void;
  onClearFilters: () => void;
  onRemoveChip: (key: "fromDate" | "toDate" | "departmentId" | "designationId") => void;
};

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="default" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        className="rounded p-0.5 hover:bg-black/5"
        aria-label={`Remove ${label} filter`}
        onClick={onRemove}
      >
        <X className="size-3" aria-hidden />
      </button>
    </Badge>
  );
}

export function ReportsToolbar({
  fromDate,
  toDate,
  departmentId,
  designationId,
  filterOptions,
  filtersOpen,
  onFiltersOpenChange,
  onFromDateChange,
  onToDateChange,
  onDepartmentChange,
  onDesignationChange,
  onGenerate,
  onClearFilters,
  onRemoveChip,
}: ReportsToolbarProps) {
  const departmentLabel = filterOptions.departments.find(
    (item) => item.value === departmentId,
  )?.label;
  const designationLabel = filterOptions.designations.find(
    (item) => item.value === designationId,
  )?.label;

  const chips: Array<{
    key: "fromDate" | "toDate" | "departmentId" | "designationId";
    label: string;
  }> = [];
  if (fromDate) chips.push({ key: "fromDate", label: `From ${fromDate}` });
  if (toDate) chips.push({ key: "toDate", label: `To ${toDate}` });
  if (departmentId && departmentLabel) {
    chips.push({ key: "departmentId", label: departmentLabel });
  }
  if (designationId && designationLabel) {
    chips.push({ key: "designationId", label: designationLabel });
  }

  const filterControls = (
    <ReportsFilters
      fromDate={fromDate}
      toDate={toDate}
      departmentId={departmentId}
      designationId={designationId}
      filterOptions={filterOptions}
      onFromDateChange={onFromDateChange}
      onToDateChange={onToDateChange}
      onDepartmentChange={onDepartmentChange}
      onDesignationChange={onDesignationChange}
    />
  );

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="hidden min-w-0 flex-1 gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
          {filterControls}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          <Button
            variant="secondary"
            className="md:hidden"
            onClick={() => onFiltersOpenChange(true)}
          >
            <Filter className="size-4" aria-hidden />
            Filters
          </Button>
          <Button variant="secondary" onClick={onGenerate}>
            Generate
          </Button>
          {chips.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <FilterChip
              key={chip.key}
              label={chip.label}
              onRemove={() => onRemoveChip(chip.key)}
            />
          ))}
        </div>
      ) : null}

      <Sheet open={filtersOpen} onOpenChange={onFiltersOpenChange} title="Report filters">
        <div className="space-y-3 p-4">
          {filterControls}
          <Button
            className="w-full"
            onClick={() => {
              onFiltersOpenChange(false);
              onGenerate();
            }}
          >
            Apply & generate
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
