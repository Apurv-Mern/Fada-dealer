"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Filter, Plus, Upload } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Pagination,
  SearchInput,
  Sheet,
  toast,
} from "@/components/ui";
import { EmployeesCards } from "@/features/employees/components/employees-cards";
import {
  EmployeesAddDialog,
  EmployeesImportDialog,
} from "@/features/employees/components/employees-dialogs";
import { EmployeesFilters } from "@/features/employees/components/employees-filters";
import { EmployeesStats } from "@/features/employees/components/employees-stats";
import { EmployeesTable } from "@/features/employees/components/employees-table";
import { deactivateEmployee } from "@/features/employees/api";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
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
  const router = useRouter();
  const pathname = usePathname();

  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [selected, setSelected] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<Employee | null>(
    null,
  );
  const [deactivating, setDeactivating] = useState(false);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
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

  async function confirmDeactivate() {
    if (!pendingDeactivate) return;
    setDeactivating(true);
    try {
      await deactivateEmployee(pendingDeactivate);
      toast.success("Employee deactivated");
      setPendingDeactivate(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to deactivate employee"));
    } finally {
      setDeactivating(false);
    }
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
        description="Search, onboard, and manage dealership employment relationships."
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload />
              Import Employees
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
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              void (async () => {
                try {
                  const targets = list.items.filter((e) =>
                    selected.includes(e.id),
                  );
                  await Promise.all(targets.map((e) => deactivateEmployee(e)));
                  toast.success(`Deactivated ${targets.length} employee(s)`);
                  setSelected([]);
                  onRefresh?.();
                } catch (err) {
                  toast.error(
                    toAuthErrorMessage(err, "Failed to deactivate employees"),
                  );
                }
              })();
            }}
          >
            Deactivate
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
            onEdit={openEdit}
            onDeactivate={setPendingDeactivate}
          />
          <EmployeesTable
            rows={pageRows}
            selected={selected}
            loading={isRefreshing}
            allVisibleSelected={allVisibleSelected}
            onToggleAll={toggleAll}
            onToggleOne={toggleOne}
            onEdit={openEdit}
            onDeactivate={setPendingDeactivate}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="employees"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />

          <ConfirmDialog
            open={pendingDeactivate !== null}
            onOpenChange={(open) => {
              if (!open) setPendingDeactivate(null);
            }}
            description={
              pendingDeactivate
                ? `Deactivate employee “${pendingDeactivate.name}”? They will be marked inactive.`
                : undefined
            }
            confirmLabel="Deactivate"
            isLoading={deactivating}
            onConfirm={confirmDeactivate}
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
      <EmployeesImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
