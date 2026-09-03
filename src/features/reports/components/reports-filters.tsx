"use client";

import { Input, Select } from "@/components/ui";
import { getVisibleReportFilters } from "@/features/reports/map-report";
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

export type ReportsFiltersProps = {
  reportKey: DealerReportKey;
  draft: ReportUrlQuery;
  filterOptions: ReportFiltersMetadata;
  onDraftChange: (patch: Partial<ReportUrlQuery>) => void;
};

function isVisible(
  fields: ReportFilterField[],
  field: ReportFilterField,
): boolean {
  return fields.includes(field);
}

export function ReportsFilters({
  reportKey,
  draft,
  filterOptions,
  onDraftChange,
}: ReportsFiltersProps) {
  const visible = getVisibleReportFilters(reportKey);

  return (
    <>
      {isVisible(visible, "fromDate") ? (
        <Input
          type="date"
          aria-label="From date"
          value={draft.fromDate}
          onChange={(event) => onDraftChange({ fromDate: event.target.value })}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "toDate") ? (
        <Input
          type="date"
          aria-label="To date"
          value={draft.toDate}
          onChange={(event) => onDraftChange({ toDate: event.target.value })}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "departmentId") ? (
        <Select
          aria-label="Department filter"
          placeholder="All Departments"
          value={draft.departmentId}
          onChange={(value) => onDraftChange({ departmentId: value })}
          options={filterOptions.departments}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "designationId") ? (
        <Select
          aria-label="Designation filter"
          placeholder="All Designations"
          value={draft.designationId}
          onChange={(value) => onDraftChange({ designationId: value })}
          options={filterOptions.designations}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "employmentStatus") ? (
        <Select
          aria-label="Employment status"
          placeholder="All employment statuses"
          value={draft.employmentStatus}
          onChange={(value) => onDraftChange({ employmentStatus: value })}
          options={EMPLOYMENT_STATUS_OPTIONS}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "fadaIdStatus") ? (
        <Select
          aria-label="FADA ID status"
          placeholder="All FADA ID statuses"
          value={draft.fadaIdStatus}
          onChange={(value) => onDraftChange({ fadaIdStatus: value })}
          options={FADA_ID_STATUS_OPTIONS}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "profileStatus") ? (
        <Select
          aria-label="Profile status"
          placeholder="All profile statuses"
          value={draft.profileStatus}
          onChange={(value) => onDraftChange({ profileStatus: value })}
          options={PROFILE_STATUS_OPTIONS}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "verificationStatus") ? (
        <Select
          aria-label="Verification status"
          placeholder="All verification statuses"
          value={draft.verificationStatus}
          onChange={(value) => onDraftChange({ verificationStatus: value })}
          options={VERIFICATION_STATUS_OPTIONS}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "membershipStatus") ? (
        <Select
          aria-label="Membership status"
          placeholder="All membership statuses"
          value={draft.membershipStatus}
          onChange={(value) => onDraftChange({ membershipStatus: value })}
          options={MEMBERSHIP_STATUS_OPTIONS}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "stage") ? (
        <Input
          aria-label="Onboarding stage"
          placeholder="Stage (e.g. registered)"
          value={draft.stage}
          onChange={(event) => onDraftChange({ stage: event.target.value })}
          className="w-full"
        />
      ) : null}
      {isVisible(visible, "eventType") ? (
        <Select
          aria-label="Event type"
          placeholder="All event types"
          value={draft.eventType}
          onChange={(value) => onDraftChange({ eventType: value })}
          options={EVENT_TYPE_OPTIONS}
          className="w-full"
        />
      ) : null}
    </>
  );
}
