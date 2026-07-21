import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ClipboardList,
  Briefcase,
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
  { label: "Dealer Profile", href: "/dealership", icon: Building2 },
  { label: "Branches", href: "/branches", icon: GitBranch },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Employment Requests", href: "/verifications", icon: ClipboardList },
  { label: "Employment Actions", href: "/employment-actions", icon: Briefcase },
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
  verifications: "/verifications",
  employmentActions: "/employment-actions",
  reports: "/reports",
  communications: "/communications",
  settings: "/settings",
} as const;
