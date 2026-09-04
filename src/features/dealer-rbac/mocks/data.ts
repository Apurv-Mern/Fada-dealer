import type {
  PortalModule,
  PortalRole,
} from "@/features/dealer-rbac/types";
import { ALL_DEALER_PERMISSIONS } from "@/features/auth/permissions";

export const mockPortalModules: PortalModule[] = [
  {
    key: "dealer_dashboard",
    name: "Dashboard",
    sortOrder: 101,
    permissions: [
      { key: "dealer_dashboard.view", name: "View dashboard", action: "view" },
    ],
  },
  {
    key: "dealer_company_profile",
    name: "Company Profile",
    sortOrder: 102,
    permissions: [
      {
        key: "dealer_company_profile.view",
        name: "View company profile",
        action: "view",
      },
      {
        key: "dealer_company_profile.edit",
        name: "Edit company profile",
        action: "edit",
      },
    ],
  },
  {
    key: "dealer_outlets",
    name: "Outlets",
    sortOrder: 103,
    permissions: [
      { key: "dealer_outlets.view", name: "View outlets", action: "view" },
      { key: "dealer_outlets.manage", name: "Manage outlets", action: "manage" },
    ],
  },
  {
    key: "dealer_employees",
    name: "Employees",
    sortOrder: 104,
    permissions: [
      { key: "dealer_employees.view", name: "View employees", action: "view" },
      {
        key: "dealer_employees.manage",
        name: "Manage employees",
        action: "manage",
      },
    ],
  },
  {
    key: "dealer_employment_requests",
    name: "Employment Requests",
    sortOrder: 105,
    permissions: [
      {
        key: "dealer_employment_requests.view",
        name: "View employment requests",
        action: "view",
      },
      {
        key: "dealer_employment_requests.manage",
        name: "Manage employment requests",
        action: "manage",
      },
    ],
  },
  {
    key: "dealer_reports",
    name: "Reports",
    sortOrder: 106,
    permissions: [
      { key: "dealer_reports.view", name: "View reports", action: "view" },
      { key: "dealer_reports.export", name: "Export reports", action: "export" },
    ],
  },
  {
    key: "dealer_communications",
    name: "Communications",
    sortOrder: 107,
    permissions: [
      {
        key: "dealer_communications.view",
        name: "View communications",
        action: "view",
      },
    ],
  },
  {
    key: "dealer_settings",
    name: "Settings",
    sortOrder: 108,
    permissions: [
      {
        key: "dealer_settings.manage",
        name: "Manage settings",
        action: "manage",
      },
      { key: "dealer_staff.view", name: "View staff members", action: "view" },
      {
        key: "dealer_staff.create",
        name: "Create staff members",
        action: "create",
      },
      { key: "dealer_staff.edit", name: "Edit staff members", action: "edit" },
      {
        key: "dealer_staff.delete",
        name: "Delete staff members",
        action: "delete",
      },
    ],
  },
];

const managerPermissions = [
  "dealer_dashboard.view",
  "dealer_company_profile.view",
  "dealer_outlets.view",
  "dealer_outlets.manage",
  "dealer_employees.view",
  "dealer_employees.manage",
  "dealer_employment_requests.view",
  "dealer_employment_requests.manage",
  "dealer_reports.view",
  "dealer_reports.export",
  "dealer_communications.view",
  "dealer_staff.view",
];

const viewerPermissions = ALL_DEALER_PERMISSIONS.filter((key) =>
  key.endsWith(".view"),
);

export let mockPortalRoles: PortalRole[] = [
  {
    id: "1",
    key: "dealer_admin",
    name: "Dealer Admin",
    description: "Full access to every dealer portal module",
    isSystem: true,
    isSuperRole: true,
    isActive: true,
    permissions: [...ALL_DEALER_PERMISSIONS],
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    key: "dealer_manager",
    name: "Dealer Manager",
    description:
      "Manage outlets, employees, employment requests, and reports; view-only staff",
    isSystem: true,
    isSuperRole: false,
    isActive: true,
    permissions: managerPermissions,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "3",
    key: "dealer_viewer",
    name: "Dealer Viewer",
    description: "Read-only access across all modules",
    isSystem: true,
    isSuperRole: false,
    isActive: true,
    permissions: viewerPermissions,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "4",
    key: "dealer_sales_lead",
    name: "Sales Lead",
    description: "Employees module only",
    isSystem: false,
    isSuperRole: false,
    isActive: true,
    permissions: ["dealer_dashboard.view", "dealer_employees.view"],
    createdAt: "2025-06-01T00:00:00.000Z",
  },
];

export function getMockRoleById(id: number | string): PortalRole | undefined {
  return mockPortalRoles.find((role) => role.id === String(id));
}

export function resetMockPortalRoles(
  next: PortalRole[] = mockPortalRoles.map((role) => ({ ...role })),
) {
  mockPortalRoles = next;
}

export function addMockPortalRole(role: PortalRole) {
  mockPortalRoles = [{ ...role }, ...mockPortalRoles];
}

export function updateMockPortalRole(id: string, next: PortalRole) {
  mockPortalRoles = mockPortalRoles.map((role) =>
    role.id === id ? next : role,
  );
}

export function removeMockPortalRole(id: string) {
  mockPortalRoles = mockPortalRoles.filter((role) => role.id !== id);
}
