"use client";

import { Filter, X } from "lucide-react";

import { Badge, Button, SearchInput, Sheet } from "@/components/ui";
import { ReportsFilters } from "@/features/reports/components/reports-filters";
import { formatSummaryLabel } from "@/features/reports/map-report";
import type {
  DealerReportKey,
  ReportFilterField,
  ReportFiltersMetadata,
  ReportUrlQuery,
} from "@/features/reports/types";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FADA_ID_STATUS_OPTIONS,
  MEMBERSHIP_STATUS_OPTIONS,
  PROFILE_STATUS_OPTIONS,
  VERIFICATION_STATUS_OPTIONS,
} from "@/features/reports/types";

export type ReportsToolbarProps = {
  reportKey: DealerReportKey;
  applied: ReportUrlQuery;
  draft: ReportUrlQuery;
  filterOptions: ReportFiltersMetadata;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  onDraftChange: (patch: Partial<ReportUrlQuery>) => void;
  onApply: () => void;
  onClearFilters: () => void;
  onRemoveChip: (key: ReportFilterField) => void;
};

function labelForOption(
  options: { label: string; value: string }[],
  value: string,
): string | undefined {
  return options.find((item) => item.value === value)?.label;
}

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
  reportKey,
  applied,
  draft,
  filterOptions,
  searchDraft,
  onSearchDraftChange,
  filtersOpen,
  onFiltersOpenChange,
  onDraftChange,
  onApply,
  onClearFilters,
  onRemoveChip,
}: ReportsToolbarProps) {
  const departmentLabel = filterOptions.departments.find(
    (item) => item.value === applied.departmentId,
  )?.label;
  const designationLabel = filterOptions.designations.find(
    (item) => item.value === applied.designationId,
  )?.label;

  const chips: Array<{ key: ReportFilterField; label: string }> = [];

  if (applied.search) {
    chips.push({ key: "search", label: `Search: ${applied.search}` });
  }
  if (applied.fromDate) {
    chips.push({ key: "fromDate", label: `From ${applied.fromDate}` });
  }
  if (applied.toDate) {
    chips.push({ key: "toDate", label: `To ${applied.toDate}` });
  }
  if (applied.departmentId && departmentLabel) {
    chips.push({ key: "departmentId", label: departmentLabel });
  }
  if (applied.designationId && designationLabel) {
    chips.push({ key: "designationId", label: designationLabel });
  }
  if (applied.employmentStatus) {
    const label = labelForOption(
      EMPLOYMENT_STATUS_OPTIONS,
      applied.employmentStatus,
    );
    if (label) chips.push({ key: "employmentStatus", label });
  }
  if (applied.fadaIdStatus) {
    const label = labelForOption(FADA_ID_STATUS_OPTIONS, applied.fadaIdStatus);
    if (label) chips.push({ key: "fadaIdStatus", label });
  }
  if (applied.profileStatus) {
    const label = labelForOption(PROFILE_STATUS_OPTIONS, applied.profileStatus);
    if (label) chips.push({ key: "profileStatus", label });
  }
  if (applied.verificationStatus) {
    const label = labelForOption(
      VERIFICATION_STATUS_OPTIONS,
      applied.verificationStatus,
    );
    if (label) chips.push({ key: "verificationStatus", label });
  }
  if (applied.membershipStatus) {
    const label = labelForOption(
      MEMBERSHIP_STATUS_OPTIONS,
      applied.membershipStatus,
    );
    if (label) chips.push({ key: "membershipStatus", label });
  }
  if (applied.stage) {
    chips.push({
      key: "stage",
      label: `Stage: ${formatSummaryLabel(applied.stage)}`,
    });
  }
  if (applied.eventType) {
    const label = labelForOption(EVENT_TYPE_OPTIONS, applied.eventType);
    if (label) chips.push({ key: "eventType", label });
  }

  const searchControl = (
    <SearchInput
      aria-label="Search employees"
      placeholder="Search by name, FADA ID, email, or phone"
      value={searchDraft}
      onChange={(event) => onSearchDraftChange(event.target.value)}
      className="w-full"
    />
  );

  const filterControls = (
    <ReportsFilters
      reportKey={reportKey}
      draft={draft}
      filterOptions={filterOptions}
      onDraftChange={onDraftChange}
    />
  );

  return (
    <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 hidden md:block">{searchControl}</div>
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
          <Button variant="secondary" onClick={onApply}>
            Apply filters
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
          <div className="md:hidden">{searchControl}</div>
          {filterControls}
          <Button
            className="w-full"
            onClick={() => {
              onFiltersOpenChange(false);
              onApply();
            }}
          >
            Apply filters
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
