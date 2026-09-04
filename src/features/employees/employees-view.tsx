"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus, Upload, UserRoundPlus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Pagination,
  SearchInput,
  Sheet,
} from "@/components/ui";
import { EmployeesCards } from "@/features/employees/components/employees-cards";
import {
  EmployeesAddDialog,
  EmployeesImportDialog,
} from "@/features/employees/components/employees-dialogs";
import { EmployeesRejoinDialog } from "@/features/employees/components/employees-rejoin-dialog";
import { EmployeesTransferDialog } from "@/features/employees/components/employees-transfer-dialog";
import { EmployeesFilters } from "@/features/employees/components/employees-filters";
import { EmployeesStats } from "@/features/employees/components/employees-stats";
import { EmployeesTable } from "@/features/employees/components/employees-table";
import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeStatus,
  EmployeeStats,
} from "@/features/employees/types";
import type { ListResult } from "@/types/api";

export type EmployeesViewProps = {
  list: ListResult<Employee>;
  stats: EmployeeStats;
  filterOptions: EmployeeFilterOptions;
  query: {
    q: string;
    page: number;
    pageSize: number;
    branchId: string;
    designationId: string;
    status: EmployeeStatus | "";
  };
  isRefreshing: boolean;
  onRefresh?: () => void;
};

export function EmployeesView({
  list,
  stats,
  filterOptions,
  query,
  isRefreshing,
  onRefresh,
}: EmployeesViewProps) {
  const { has } = usePermissions();
  const canManageEmployees = has(PERMISSION.employeesManage);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [selected, setSelected] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(
    () => searchParams.get("import") === "1",
  );
  const [editing, setEditing] = useState<Employee | null>(null);
  const [transferring, setTransferring] = useState<Employee | null>(null);
  const [rejoinOpen, setRejoinOpen] = useState(false);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  useEffect(() => {
    if (searchParams.get("import") === "1") {
      setImportOpen(true);
    }
  }, [searchParams]);

  function setImportDialogOpen(open: boolean) {
    setImportOpen(open);
    if (!open && searchParams.get("import") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("import");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  const syncUrl = useCallback(
    (next: {
      page?: number;
      pageSize?: number;
      q?: string;
      branchId?: string;
      designationId?: string;
      status?: EmployeeStatus | "";
    }) => {
      const params = new URLSearchParams();
      const nextPage = next.page ?? query.page;
      const nextPageSize = next.pageSize ?? query.pageSize;
      const nextQ = next.q ?? query.q;
      const nextBranch = next.branchId ?? query.branchId;
      const nextDesignation = next.designationId ?? query.designationId;
      const nextStatus = next.status ?? query.status;

      if (nextQ) params.set("q", nextQ);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPageSize !== 10) params.set("pageSize", String(nextPageSize));
      if (nextBranch) params.set("branchId", nextBranch);
      if (nextDesignation) params.set("designationId", nextDesignation);
      if (nextStatus) params.set("status", nextStatus);

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

  const pageRows = list.items;
  const allVisibleSelected =
    pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id));

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((prev) =>
        prev.filter((id) => !pageRows.some((row) => row.id === id)),
      );
      return;
    }
    setSelected((prev) => [
      ...new Set([...prev, ...pageRows.map((row) => row.id)]),
    ]);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setAddOpen(true);
  }

  const filterControls = (
    <EmployeesFilters
      branchId={query.branchId}
      designationId={query.designationId}
      status={query.status}
      filterOptions={filterOptions}
      onBranchChange={(value) => syncUrl({ page: 1, branchId: value })}
      onDesignationChange={(value) =>
        syncUrl({ page: 1, designationId: value })
      }
      onStatusChange={(value) => syncUrl({ page: 1, status: value })}
    />
  );

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Search, onboard, and manage company employment relationships."
        actions={
          canManageEmployees ? (
            <>
              <Button variant="secondary" onClick={() => setImportDialogOpen(true)}>
                <Upload />
                Import Employees
              </Button>
              <Button variant="secondary" onClick={() => setRejoinOpen(true)}>
                <UserRoundPlus />
                Invite Employee
              </Button>
              <Button
                onClick={() => {
                  setEditing(null);
                  setAddOpen(true);
                }}
              >
                <Plus />
                Add New Employee
              </Button>
            </>
          ) : undefined
        }
      />

      <EmployeesStats stats={stats} loading={isRefreshing} />

      {selected.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-heading)]">
            {selected.length} selected
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <CardTitle>Employee List</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search by name, FADA ID, email…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              containerClassName="sm:w-72"
            />
            <div className="hidden gap-2 md:flex">{filterControls}</div>
            <Button
              variant="secondary"
              size="md"
              className="md:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter />
              Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <EmployeesCards
            rows={pageRows}
            selected={selected}
            loading={isRefreshing}
            onToggleOne={toggleOne}
            onEdit={canManageEmployees ? openEdit : undefined}
            onTransfer={canManageEmployees ? setTransferring : undefined}
          />
          <EmployeesTable
            rows={pageRows}
            selected={selected}
            loading={isRefreshing}
            allVisibleSelected={allVisibleSelected}
            onToggleAll={toggleAll}
            onToggleOne={toggleOne}
            onEdit={canManageEmployees ? openEdit : undefined}
            onTransfer={canManageEmployees ? setTransferring : undefined}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="employees"
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
        <div className="space-y-4 p-4">
          {filterControls}
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            Apply
          </Button>
        </div>
      </Sheet>

      <EmployeesAddDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditing(null);
        }}
        employee={editing}
        filterOptions={filterOptions}
        onSaved={onRefresh}
      />
      <EmployeesImportDialog
        open={importOpen}
        onOpenChange={setImportDialogOpen}
        onImported={onRefresh}
      />
      <EmployeesTransferDialog
        employee={transferring}
        filterOptions={filterOptions}
        open={transferring !== null}
        onOpenChange={(open) => {
          if (!open) setTransferring(null);
        }}
        onTransferred={onRefresh}
      />
      <EmployeesRejoinDialog
        open={rejoinOpen}
        onOpenChange={setRejoinOpen}
        filterOptions={filterOptions}
        onInvited={onRefresh}
      />
    </div>
  );
}
