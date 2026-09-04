"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Filter } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Dialog,
  Pagination,
  SearchInput,
  Sheet,
  toast,
} from "@/components/ui";
import { updateRequestStatus } from "@/features/employment-requests/api";
import { EmploymentExitDialog } from "@/features/employment-requests/components/employment-exit-dialog";
import { EmploymentJoinDialog } from "@/features/employment-requests/components/employment-join-dialog";
import { EmploymentRequestsCards } from "@/features/employment-requests/components/employment-requests-cards";
import { EmploymentRequestsFilters } from "@/features/employment-requests/components/employment-requests-filters";
import { EmploymentRequestsStats } from "@/features/employment-requests/components/employment-requests-stats";
import { EmploymentRequestsTable } from "@/features/employment-requests/components/employment-requests-table";
import { EmploymentRequestsTabs } from "@/features/employment-requests/components/employment-requests-tabs";
import { exportEmploymentRequestsCsv } from "@/features/employment-requests/export-csv";
import { applyEmploymentRequestsQueryPatch } from "@/features/employment-requests/search-params";
import type {
  EmploymentRequest,
  EmploymentRequestFilterOptions,
  EmploymentRequestStatus,
  EmploymentRequestStats,
  EmploymentRequestTypeCounts,
  EmploymentRequestTypeFilter,
} from "@/features/employment-requests/types";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import type { ListResult } from "@/types/api";

export type EmploymentRequestsViewProps = {
  list: ListResult<EmploymentRequest>;
  filteredItems: EmploymentRequest[];
  stats: EmploymentRequestStats;
  typeCounts: EmploymentRequestTypeCounts;
  filterOptions: EmploymentRequestFilterOptions;
  query: {
    q: string;
    page: number;
    pageSize: number;
    type: EmploymentRequestTypeFilter;
    status: EmploymentRequestStatus | "";
    branchId: string;
  };
  isRefreshing: boolean;
  onRefresh?: () => void;
};

export function EmploymentRequestsView({
  list,
  filteredItems,
  stats,
  typeCounts,
  filterOptions,
  query,
  isRefreshing,
  onRefresh,
}: EmploymentRequestsViewProps) {
  const { has } = usePermissions();
  const canManageRequests = has(PERMISSION.employmentRequestsManage);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingApprove, setPendingApprove] = useState<EmploymentRequest | null>(
    null,
  );
  const [pendingReject, setPendingReject] = useState<EmploymentRequest | null>(
    null,
  );
  const [viewingExit, setViewingExit] = useState<EmploymentRequest | null>(
    null,
  );
  const [viewingJoin, setViewingJoin] = useState<EmploymentRequest | null>(
    null,
  );
  const [deciding, setDeciding] = useState(false);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  const syncUrl = useCallback(
    (next: {
      page?: number;
      pageSize?: number;
      q?: string;
      type?: EmploymentRequestTypeFilter;
      status?: EmploymentRequestStatus | "";
      branchId?: string;
    }) => {
      const params = applyEmploymentRequestsQueryPatch(
        searchParams.toString(),
        next,
      );
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (searchDraft === query.q) return;
    const handle = window.setTimeout(() => {
      syncUrl({ page: 1, q: searchDraft });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query.q, syncUrl]);

  async function confirmApprove() {
    if (!pendingApprove) return;
    setDeciding(true);
    try {
      await updateRequestStatus(pendingApprove, "accept");
      toast.success("Request approved");
      setPendingApprove(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to approve request"));
    } finally {
      setDeciding(false);
    }
  }

  async function confirmReject() {
    if (!pendingReject) return;
    setDeciding(true);
    try {
      await updateRequestStatus(pendingReject, "reject");
      toast.success("Request rejected");
      setPendingReject(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to reject request"));
    } finally {
      setDeciding(false);
    }
  }

  function handleExport() {
    exportEmploymentRequestsCsv(filteredItems);
    toast.success(
      filteredItems.length === 0
        ? "Exported empty request list"
        : `Exported ${filteredItems.length} request(s)`,
    );
  }

  const filterControls = (
    <EmploymentRequestsFilters
      type={query.type}
      status={query.status}
      branchId={query.branchId}
      filterOptions={filterOptions}
      onTypeChange={(value) => syncUrl({ page: 1, type: value })}
      onStatusChange={(value) => syncUrl({ page: 1, status: value })}
      onBranchChange={(value) => syncUrl({ page: 1, branchId: value })}
    />
  );

  return (
    <div>
      <PageHeader
        title="Employment Requests"
        description="Manage all employment related requests from employees."
        actions={
          <Button variant="secondary" onClick={handleExport}>
            <Download />
            Export Requests
          </Button>
        }
      />

      <EmploymentRequestsTabs
        value={query.type}
        counts={typeCounts}
        onChange={(value) => syncUrl({ page: 1, type: value })}
      />

      <EmploymentRequestsStats
        stats={stats}
        loading={isRefreshing}
        typeLabel={
          query.type
            ? `${query.type} requests only`
            : "Across all types"
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search by employee name, FADA ID or request type"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              containerClassName="w-full sm:min-w-0 sm:flex-1"
            />
            <div className="hidden gap-2 lg:flex">{filterControls}</div>
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
          <EmploymentRequestsCards
            rows={list.items}
            loading={isRefreshing}
            onApprove={canManageRequests ? setPendingApprove : undefined}
            onReject={canManageRequests ? setPendingReject : undefined}
            onView={(row) =>
              row.requestType === "Join"
                ? setViewingJoin(row)
                : setViewingExit(row)
            }
          />
          <EmploymentRequestsTable
            rows={list.items}
            loading={isRefreshing}
            onApprove={canManageRequests ? setPendingApprove : undefined}
            onReject={canManageRequests ? setPendingReject : undefined}
            onView={(row) =>
              row.requestType === "Join"
                ? setViewingJoin(row)
                : setViewingExit(row)
            }
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="requests"
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
          {filterControls}
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            Apply
          </Button>
        </div>
      </Sheet>

      <Dialog
        open={pendingApprove !== null}
        onOpenChange={(open) => {
          if (deciding) return;
          if (!open) setPendingApprove(null);
        }}
        title="Approve request?"
        description={
          pendingApprove
            ? `Approve ${
                pendingApprove.requestType === "Exit" ? "exit" : "join"
              } request for “${pendingApprove.employeeName}”?`
            : undefined
        }
        className="max-w-md"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={deciding}
            onClick={() => setPendingApprove(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            isLoading={deciding}
            onClick={() => void confirmApprove()}
          >
            Approve
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={pendingReject !== null}
        onOpenChange={(open) => {
          if (!open) setPendingReject(null);
        }}
        title="Reject request?"
        description={
          pendingReject
            ? `Reject ${
                pendingReject.requestType === "Exit" ? "exit" : "join"
              } request for “${pendingReject.employeeName}”?`
            : undefined
        }
        confirmLabel="Reject"
        onConfirm={confirmReject}
        isLoading={deciding}
      />

      <EmploymentExitDialog
        request={viewingExit}
        open={viewingExit !== null}
        onOpenChange={(open) => {
          if (!open) setViewingExit(null);
        }}
        onApprove={
          canManageRequests
            ? (row) => {
                setViewingExit(null);
                setPendingApprove(row);
              }
            : undefined
        }
        onReject={
          canManageRequests
            ? (row) => {
                setViewingExit(null);
                setPendingReject(row);
              }
            : undefined
        }
        onAdvanced={onRefresh}
      />

      <EmploymentJoinDialog
        request={viewingJoin}
        open={viewingJoin !== null}
        onOpenChange={(open) => {
          if (!open) setViewingJoin(null);
        }}
        onApprove={
          canManageRequests
            ? (row) => {
                setViewingJoin(null);
                setPendingApprove(row);
              }
            : undefined
        }
        onReject={
          canManageRequests
            ? (row) => {
                setViewingJoin(null);
                setPendingReject(row);
              }
            : undefined
        }
        onAdvanced={onRefresh}
      />
    </div>
  );
}
