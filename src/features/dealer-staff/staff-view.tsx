"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Pagination,
  SearchInput,
  toast,
} from "@/components/ui";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import { deleteStaff, toggleStaffActive } from "@/features/dealer-staff/api";
import { StaffCards } from "@/features/dealer-staff/components/staff-cards";
import { StaffDialog } from "@/features/dealer-staff/components/staff-dialog";
import { StaffTable } from "@/features/dealer-staff/components/staff-table";
import type { StaffMember } from "@/features/dealer-staff/types";
import type { ListResult } from "@/types/api";

export function StaffView({
  list,
  query,
  isRefreshing,
  onRefresh,
}: {
  list: ListResult<StaffMember>;
  query: { q: string; page: number; pageSize: number };
  isRefreshing: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, has } = usePermissions();
  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [pendingToggle, setPendingToggle] = useState<StaffMember | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StaffMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  const syncUrl = useCallback(
    (next: { page?: number; pageSize?: number; q?: string }) => {
      const params = new URLSearchParams(window.location.search);
      const nextPage = next.page ?? query.page;
      const nextPageSize = next.pageSize ?? query.pageSize;
      const nextQ = next.q ?? query.q;
      if (nextQ) params.set("q", nextQ);
      else params.delete("q");
      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");
      if (nextPageSize !== 10) params.set("pageSize", String(nextPageSize));
      else params.delete("pageSize");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, query, router],
  );

  useEffect(() => {
    if (searchDraft === query.q) return;
    const handle = window.setTimeout(() => {
      syncUrl({ page: 1, q: searchDraft });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query.q, syncUrl]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setDialogOpen(true);
  }

  async function confirmToggle() {
    if (!pendingToggle) return;
    setActionLoading(true);
    try {
      const nextActive = await toggleStaffActive(pendingToggle.id);
      toast.success(nextActive ? "Staff member activated" : "Staff member deactivated");
      setPendingToggle(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to update staff status"));
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setActionLoading(true);
    try {
      await deleteStaff(pendingDelete.id);
      toast.success("Staff member deleted");
      setPendingDelete(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to delete staff member"));
    } finally {
      setActionLoading(false);
    }
  }

  const canCreate = has(PERMISSION.staffCreate);

  return (
    <div>
      <PageHeader
        title="Staff members"
        description="Manage portal staff accounts and their assigned roles."
        actions={
          canCreate ? (
            <Button onClick={openCreate}>
              <Plus />
              Add staff member
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search by name, email, or role"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            containerClassName="w-full sm:min-w-0 sm:flex-1"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <StaffCards
            rows={list.items}
            loading={isRefreshing}
            currentUserId={profile?.id}
            onEdit={openEdit}
            onToggleActive={setPendingToggle}
            onDelete={setPendingDelete}
          />
          <StaffTable
            rows={list.items}
            loading={isRefreshing}
            currentUserId={profile?.id}
            onEdit={openEdit}
            onToggleActive={setPendingToggle}
            onDelete={setPendingDelete}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="staff"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />
        </CardContent>
      </Card>

      <StaffDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        member={editing}
        onSaved={onRefresh}
      />

      <ConfirmDialog
        open={pendingToggle !== null}
        onOpenChange={(open) => {
          if (!open) setPendingToggle(null);
        }}
        title={
          pendingToggle?.isActive
            ? "Deactivate staff member?"
            : "Activate staff member?"
        }
        description={
          pendingToggle
            ? pendingToggle.isActive
              ? `Deactivate “${pendingToggle.name}”? They will lose portal access.`
              : `Reactivate “${pendingToggle.name}”?`
            : undefined
        }
        confirmLabel={pendingToggle?.isActive ? "Deactivate" : "Activate"}
        isLoading={actionLoading}
        onConfirm={confirmToggle}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete staff member?"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? This soft-deletes their portal account.`
            : undefined
        }
        confirmLabel="Delete"
        isLoading={actionLoading}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
