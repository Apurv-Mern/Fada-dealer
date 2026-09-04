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
import { usePermissions } from "@/features/auth/permissions-context";
import { deleteRole } from "@/features/dealer-rbac/api";
import { RoleDialog } from "@/features/dealer-rbac/components/role-dialog";
import { RolesTable } from "@/features/dealer-rbac/components/roles-table";
import type { PortalRole } from "@/features/dealer-rbac/types";
import type { ListResult } from "@/types/api";

export function RolesView({
  list,
  query,
  isRefreshing,
  onRefresh,
}: {
  list: ListResult<PortalRole>;
  query: { q: string; page: number; pageSize: number };
  isRefreshing: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { canManageRoles } = usePermissions();
  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PortalRole | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PortalRole | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRole(pendingDelete.id);
      toast.success("Role deleted");
      setPendingDelete(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to delete role"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        description="Define portal roles and assign module permissions for staff accounts."
        actions={
          canManageRoles ? (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus />
              Create role
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search by name or key"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            containerClassName="w-full sm:min-w-0 sm:flex-1"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <RolesTable
            rows={list.items}
            loading={isRefreshing}
            onEdit={(role) => {
              setEditing(role);
              setDialogOpen(true);
            }}
            onDelete={setPendingDelete}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="roles"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />
        </CardContent>
      </Card>

      <RoleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        role={editing}
        onSaved={onRefresh}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete role?"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? Roles assigned to staff cannot be deleted.`
            : undefined
        }
        confirmLabel="Delete"
        isLoading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
