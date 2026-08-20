"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, Filter } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  SearchInput,
  Sheet,
  toast,
} from "@/components/ui";
import { EmploymentActionsCards } from "@/features/employment-actions/components/employment-actions-cards";
import { EmploymentActionsFilters } from "@/features/employment-actions/components/employment-actions-filters";
import { EmploymentActionsStats } from "@/features/employment-actions/components/employment-actions-stats";
import { EmploymentActionsTable } from "@/features/employment-actions/components/employment-actions-table";
import { EmploymentActionViewDialog } from "@/features/employment-actions/components/employment-action-view-dialog";
import { exportEmploymentActionsCsv } from "@/features/employment-actions/export-csv";
import type {
  EmploymentAction,
  EmploymentActionFilterOptions,
  EmploymentActionStats,
  EmploymentActionStatus,
  EmploymentActionTypeFilter,
} from "@/features/employment-actions/types";
import type { ListResult } from "@/types/api";

export type EmploymentActionsViewProps = {
  list: ListResult<EmploymentAction>;
  filteredItems: EmploymentAction[];
  stats: EmploymentActionStats;
  filterOptions: EmploymentActionFilterOptions;
  query: {
    q: string;
    page: number;
    pageSize: number;
    actionType: EmploymentActionTypeFilter;
    status: EmploymentActionStatus | "";
    branchId: string;
    from: string;
    to: string;
  };
  isRefreshing: boolean;
};

export function EmploymentActionsView({
  list,
  filteredItems,
  stats,
  filterOptions,
  query,
  isRefreshing,
}: EmploymentActionsViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewing, setViewing] = useState<EmploymentAction | null>(null);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  const syncUrl = useCallback(
    (next: {
      page?: number;
      pageSize?: number;
      q?: string;
      actionType?: EmploymentActionTypeFilter;
      status?: EmploymentActionStatus | "";
      branchId?: string;
      from?: string;
      to?: string;
    }) => {
      const params = new URLSearchParams();
      const nextPage = next.page ?? query.page;
      const nextPageSize = next.pageSize ?? query.pageSize;
      const nextQ = next.q ?? query.q;
      const nextType =
        next.actionType !== undefined ? next.actionType : query.actionType;
      const nextStatus =
        next.status !== undefined ? next.status : query.status;
      const nextBranch =
        next.branchId !== undefined ? next.branchId : query.branchId;
      const nextFrom = next.from !== undefined ? next.from : query.from;
      const nextTo = next.to !== undefined ? next.to : query.to;

      if (nextQ) params.set("q", nextQ);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPageSize !== 10) params.set("pageSize", String(nextPageSize));
      if (nextType) params.set("actionType", nextType);
      if (nextStatus) params.set("status", nextStatus);
      if (nextBranch) params.set("branchId", nextBranch);
      if (nextFrom) params.set("from", nextFrom);
      if (nextTo) params.set("to", nextTo);

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, query],
  );

  useEffect(() => {
    if (searchDraft === query.q) return;
    const handle = window.setTimeout(() => {
      syncUrl({ page: 1, q: searchDraft });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query.q, syncUrl]);

  function handleExport() {
    exportEmploymentActionsCsv(filteredItems);
    toast.success(
      filteredItems.length === 0
        ? "Exported empty actions list"
        : `Exported ${filteredItems.length} action(s)`,
    );
  }

  const filterControls = (
    <EmploymentActionsFilters
      actionType={query.actionType}
      status={query.status}
      branchId={query.branchId}
      from={query.from}
      to={query.to}
      filterOptions={filterOptions}
      onActionTypeChange={(value) => syncUrl({ page: 1, actionType: value })}
      onStatusChange={(value) => syncUrl({ page: 1, status: value })}
      onBranchChange={(value) => syncUrl({ page: 1, branchId: value })}
      onDateRangeChange={({ from, to }) => syncUrl({ page: 1, from, to })}
    />
  );

  return (
    <div>
      <PageHeader
        title="Employment Actions"
        description="Track and manage all actions taken on employee profiles."
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download />
            Export Actions
          </Button>
        }
      />

      <EmploymentActionsStats stats={stats} loading={isRefreshing} />

      <Card>
        <CardHeader className="flex-col items-stretch gap-4">
          <CardTitle>Actions List</CardTitle>
          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
            <SearchInput
              placeholder="Search by employee name, ID, or mobile"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              containerClassName="w-full lg:min-w-0 lg:flex-1"
            />
            <div className="hidden shrink-0 gap-2 lg:flex lg:items-center">
              {filterControls}
            </div>
            <Button
              variant="secondary"
              size="md"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter />
              Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <EmploymentActionsCards
            rows={list.items}
            loading={isRefreshing}
            onView={setViewing}
          />
          <EmploymentActionsTable
            rows={list.items}
            loading={isRefreshing}
            onView={setViewing}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="actions"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />
        </CardContent>
      </Card>

      <Sheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        side="right"
        title="Filters"
      >
        <div className="flex flex-col gap-3 p-4">
          <EmploymentActionsFilters
            actionType={query.actionType}
            status={query.status}
            branchId={query.branchId}
            from={query.from}
            to={query.to}
            filterOptions={filterOptions}
            onActionTypeChange={(value) =>
              syncUrl({ page: 1, actionType: value })
            }
            onStatusChange={(value) => syncUrl({ page: 1, status: value })}
            onBranchChange={(value) => syncUrl({ page: 1, branchId: value })}
            onDateRangeChange={({ from, to }) =>
              syncUrl({ page: 1, from, to })
            }
          />
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            Apply
          </Button>
        </div>
      </Sheet>

      <EmploymentActionViewDialog
        action={viewing}
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
    </div>
  );
}
