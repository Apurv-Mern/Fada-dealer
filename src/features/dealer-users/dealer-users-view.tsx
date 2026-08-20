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
import { updateDealerUser } from "@/features/dealer-users/api";
import { DealerUserDialog } from "@/features/dealer-users/components/dealer-users-dialog";
import { DealerUsersCards } from "@/features/dealer-users/components/dealer-users-cards";
import { DealerUsersTable } from "@/features/dealer-users/components/dealer-users-table";
import type { DealerUser } from "@/features/dealer-users/types";
import type { ListResult } from "@/types/api";

export function DealerUsersView({
  list,
  activeAdminCount,
  query,
  isRefreshing,
  onRefresh,
}: {
  list: ListResult<DealerUser>;
  activeAdminCount: number;
  query: { q: string; page: number; pageSize: number };
  isRefreshing: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchDraft, setSearchDraft] = useState(query.q);
  const [searchFromUrl, setSearchFromUrl] = useState(query.q);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DealerUser | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<DealerUser | null>(
    null,
  );
  const [deactivating, setDeactivating] = useState(false);

  if (query.q !== searchFromUrl) {
    setSearchFromUrl(query.q);
    setSearchDraft(query.q);
  }

  const syncUrl = useCallback(
    (next: { page?: number; pageSize?: number; q?: string }) => {
      const params = new URLSearchParams();
      const nextPage = next.page ?? query.page;
      const nextPageSize = next.pageSize ?? query.pageSize;
      const nextQ = next.q ?? query.q;
      if (nextQ) params.set("q", nextQ);
      if (nextPage > 1) params.set("page", String(nextPage));
      if (nextPageSize !== 10) params.set("pageSize", String(nextPageSize));
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

  function openInvite() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(user: DealerUser) {
    setEditing(user);
    setDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!pendingDeactivate) return;
    if (
      pendingDeactivate.role === "dealer_admin" &&
      pendingDeactivate.isActive &&
      activeAdminCount <= 1
    ) {
      toast.error("Cannot deactivate the last company admin");
      return;
    }
    setDeactivating(true);
    try {
      await updateDealerUser(pendingDeactivate.id, {
        name: pendingDeactivate.name,
        phone: pendingDeactivate.phone,
        role: pendingDeactivate.role,
        isActive: false,
      });
      toast.success("User deactivated");
      setPendingDeactivate(null);
      onRefresh?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to deactivate user"));
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage company portal users and access roles."
        actions={
          <Button onClick={openInvite}>
            <Plus />
            Invite User
          </Button>
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
          <DealerUsersCards
            rows={list.items}
            loading={isRefreshing}
            activeAdminCount={activeAdminCount}
            onEdit={openEdit}
            onDeactivate={setPendingDeactivate}
          />
          <DealerUsersTable
            rows={list.items}
            loading={isRefreshing}
            activeAdminCount={activeAdminCount}
            onEdit={openEdit}
            onDeactivate={setPendingDeactivate}
          />
          <Pagination
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            label="users"
            onPageChange={(next) => syncUrl({ page: next })}
            onPageSizeChange={(size) => syncUrl({ page: 1, pageSize: size })}
          />
        </CardContent>
      </Card>

      <DealerUserDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        user={editing}
        onSaved={onRefresh}
      />

      <ConfirmDialog
        open={pendingDeactivate !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeactivate(null);
        }}
        title="Deactivate user?"
        description={
          pendingDeactivate
            ? `Deactivate “${pendingDeactivate.name}”? They will lose portal access.`
            : undefined
        }
        confirmLabel="Deactivate"
        isLoading={deactivating}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
