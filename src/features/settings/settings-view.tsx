"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

import { SectionError } from "@/components/layout/section-error";
import { cn } from "@/lib/utils/cn";
import { PERMISSION } from "@/features/auth/permissions";
import { usePermissions } from "@/features/auth/permissions-context";
import { getRolesPage } from "@/features/dealer-rbac/api";
import { RolesSkeleton } from "@/features/dealer-rbac/roles-skeleton";
import { RolesView } from "@/features/dealer-rbac/roles-view";
import { getStaffPage } from "@/features/dealer-staff/api";
import { StaffSkeleton } from "@/features/dealer-staff/staff-skeleton";
import { StaffView } from "@/features/dealer-staff/staff-view";
import {
  parseSettingsTab,
  type SettingsTab,
} from "@/features/settings/search-params";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

function SettingsTabs({
  activeTab,
  showStaff,
  showRoles,
}: {
  activeTab: SettingsTab;
  showStaff: boolean;
  showRoles: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(tab: SettingsTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "staff") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const tabs = [
    showStaff ? { id: "staff" as const, label: "Staff members" } : null,
    showRoles ? { id: "roles" as const, label: "Roles & permissions" } : null,
  ].filter(Boolean) as { id: SettingsTab; label: string }[];

  if (tabs.length <= 1) return null;

  return (
    <div
      className="mb-4 flex w-full flex-wrap gap-2"
      role="tablist"
      aria-label="Settings sections"
    >
      {tabs.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            scroll={false}
            role="tab"
            aria-selected={selected}
            className={cn(
              "rounded-[var(--radius-lg)] border px-4 py-2.5 text-sm transition",
              selected
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function SettingsStaffPanel({
  query,
}: {
  query: { q: string; page: number; pageSize: number };
}) {
  const resourceKey = ["staff", query.q, query.page, query.pageSize].join("|");
  const loader = useCallback(
    () =>
      getStaffPage({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q || undefined,
      }).then((data) => data.list),
    [query],
  );

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) return <StaffSkeleton />;
  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load staff members."}
        onRetry={retry}
      />
    );
  }
  if (!data) return <StaffSkeleton />;

  return (
    <StaffView
      list={data}
      query={query}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

function SettingsRolesPanel({
  query,
}: {
  query: { q: string; page: number; pageSize: number };
}) {
  const resourceKey = ["roles", query.q, query.page, query.pageSize].join("|");
  const loader = useCallback(
    () =>
      getRolesPage({
        page: query.page,
        pageSize: query.pageSize,
        q: query.q || undefined,
      }).then((data) => data.list),
    [query],
  );

  const { data, error, loading, isRefreshing, retry } = useAsyncResource({
    key: resourceKey,
    loader,
  });

  if (loading && !data) return <RolesSkeleton />;
  if ((error && !data) || (!loading && !isRefreshing && !data)) {
    return (
      <SectionError
        description={error ?? "Couldn't load roles."}
        onRetry={retry}
      />
    );
  }
  if (!data) return <RolesSkeleton />;

  return (
    <RolesView
      list={data}
      query={query}
      isRefreshing={isRefreshing}
      onRefresh={retry}
    />
  );
}

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const { has, canManageRoles, canAccessSettings } = usePermissions();

  const query = useMemo(() => {
    const q = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize") || "10") || 10,
    );
    return { q, page, pageSize };
  }, [searchParams]);

  const showStaff = has(PERMISSION.staffView);
  const showRoles = canManageRoles;
  const requestedTab = parseSettingsTab(searchParams.get("tab"));

  const activeTab: SettingsTab =
    requestedTab === "roles" && showRoles
      ? "roles"
      : showStaff
        ? "staff"
        : showRoles
          ? "roles"
          : "staff";

  if (!canAccessSettings || (!showStaff && !showRoles)) {
    return (
      <SectionError description="You don't have access to Settings." />
    );
  }

  return (
    <div>
      <SettingsTabs
        activeTab={activeTab}
        showStaff={showStaff}
        showRoles={showRoles}
      />
      {activeTab === "staff" ? (
        <SettingsStaffPanel query={query} />
      ) : (
        <SettingsRolesPanel query={query} />
      )}
    </div>
  );
}

export function SettingsView() {
  return (
    <Suspense fallback={<StaffSkeleton />}>
      <SettingsPageInner />
    </Suspense>
  );
}
