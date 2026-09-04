import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ClipboardList,
  BarChart3,
  Megaphone,
  Settings,
} from "lucide-react";

import { PERMISSION } from "@/features/auth/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Single permission or any-of list required to show and access the route. */
  permission?: string | readonly string[];
};

export const dealerNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: PERMISSION.dashboardView,
  },
  {
    label: "Company Profile",
    href: "/dealership",
    icon: Building2,
    permission: PERMISSION.companyProfileView,
  },
  {
    label: "Outlets",
    href: "/branches",
    icon: GitBranch,
    permission: PERMISSION.outletsView,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
    permission: PERMISSION.employeesView,
  },
  {
    label: "Employment Requests",
    href: "/verifications",
    icon: ClipboardList,
    permission: PERMISSION.employmentRequestsView,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: PERMISSION.reportsView,
  },
  {
    label: "Communications",
    href: "/communications",
    icon: Megaphone,
    permission: PERMISSION.communicationsView,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    permission: [PERMISSION.staffView, PERMISSION.settingsManage],
  },
];

export const routes = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  dealership: "/dealership",
  branches: "/branches",
  employees: "/employees",
  employeeDetail: (id: string) =>
    `/employees/detail/?id=${encodeURIComponent(id)}`,
  verifications: "/verifications",
  employmentActions: "/employment-actions",
  reports: "/reports",
  communications: "/communications",
  settings: "/settings",
} as const;

function navItemAllowed(
  item: NavItem,
  has: (key: string) => boolean,
  hasAny: (keys: readonly string[]) => boolean,
): boolean {
  if (!item.permission) return true;
  if (Array.isArray(item.permission)) return hasAny(item.permission);
  return has(item.permission as string);
}

export function getAllowedNavItems(
  has: (key: string) => boolean,
  hasAny: (keys: readonly string[]) => boolean,
): NavItem[] {
  return dealerNavItems.filter((item) => navItemAllowed(item, has, hasAny));
}

export function getRoutePermission(
  pathname: string,
): string | readonly string[] | undefined {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const match = dealerNavItems.find((item) => {
    const href = item.href.endsWith("/") ? item.href : `${item.href}/`;
    return normalized === href || normalized.startsWith(href);
  });
  if (match) return match.permission;

  if (normalized.startsWith("/employees/detail/")) {
    return PERMISSION.employeesView;
  }

  return undefined;
}

export function canShowSettingsLink(
  has: (key: string) => boolean,
  hasAny: (keys: readonly string[]) => boolean,
): boolean {
  return hasAny([PERMISSION.staffView, PERMISSION.settingsManage]);
}
