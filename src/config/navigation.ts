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

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const dealerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Company Profile", href: "/dealership", icon: Building2 },
  { label: "Branches", href: "/branches", icon: GitBranch },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Employment Requests", href: "/verifications", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Communications", href: "/communications", icon: Megaphone },
  { label: "Settings", href: "/settings", icon: Settings },
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
