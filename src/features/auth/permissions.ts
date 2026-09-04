import type { SessionPayload } from "@/features/auth/auth-utils";

/** Flat permission keys from Swagger DealerPortalModuleCatalog. */
export const ALL_DEALER_PERMISSIONS = [
  "dealer_dashboard.view",
  "dealer_company_profile.view",
  "dealer_company_profile.edit",
  "dealer_outlets.view",
  "dealer_outlets.manage",
  "dealer_employees.view",
  "dealer_employees.manage",
  "dealer_employment_requests.view",
  "dealer_employment_requests.manage",
  "dealer_reports.view",
  "dealer_reports.export",
  "dealer_communications.view",
  "dealer_settings.manage",
  "dealer_staff.view",
  "dealer_staff.create",
  "dealer_staff.edit",
  "dealer_staff.delete",
] as const;

export type DealerPermission = (typeof ALL_DEALER_PERMISSIONS)[number];

export const PERMISSION = {
  dashboardView: "dealer_dashboard.view",
  companyProfileView: "dealer_company_profile.view",
  companyProfileEdit: "dealer_company_profile.edit",
  outletsView: "dealer_outlets.view",
  outletsManage: "dealer_outlets.manage",
  employeesView: "dealer_employees.view",
  employeesManage: "dealer_employees.manage",
  employmentRequestsView: "dealer_employment_requests.view",
  employmentRequestsManage: "dealer_employment_requests.manage",
  reportsView: "dealer_reports.view",
  reportsExport: "dealer_reports.export",
  communicationsView: "dealer_communications.view",
  settingsManage: "dealer_settings.manage",
  staffView: "dealer_staff.view",
  staffCreate: "dealer_staff.create",
  staffEdit: "dealer_staff.edit",
  staffDelete: "dealer_staff.delete",
} as const satisfies Record<string, DealerPermission>;

export function isPrimaryDealer(profile: SessionPayload | null | undefined): boolean {
  return profile?.userType === "dealer";
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  key: string,
  options?: { isSuperRole?: boolean },
): boolean {
  if (options?.isSuperRole) return true;
  if (!permissions?.length) return false;
  return permissions.includes(key);
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  keys: readonly string[],
  options?: { isSuperRole?: boolean },
): boolean {
  if (options?.isSuperRole) return true;
  return keys.some((key) => hasPermission(permissions, key));
}

export function canViewModule(
  permissions: readonly string[] | undefined,
  moduleKey: string,
  options?: { isSuperRole?: boolean },
): boolean {
  return hasPermission(permissions, `${moduleKey}.view`, options);
}

export function canManageModule(
  permissions: readonly string[] | undefined,
  moduleKey: string,
  options?: { isSuperRole?: boolean },
): boolean {
  return (
    hasPermission(permissions, `${moduleKey}.manage`, options) ||
    hasPermission(permissions, `${moduleKey}.edit`, options)
  );
}

export function canAccessSettings(profile: SessionPayload | null | undefined): boolean {
  if (!profile) return false;
  return hasAnyPermission(profile.permissions, [
    PERMISSION.staffView,
    PERMISSION.settingsManage,
  ], { isSuperRole: profile.isSuperRole });
}

export function canManageStaff(profile: SessionPayload | null | undefined): boolean {
  if (!profile) return false;
  if (isPrimaryDealer(profile)) return true;
  return hasAnyPermission(profile.permissions, [
    PERMISSION.staffCreate,
    PERMISSION.staffEdit,
    PERMISSION.staffDelete,
  ], { isSuperRole: profile.isSuperRole });
}

export function canManageRoles(profile: SessionPayload | null | undefined): boolean {
  if (!profile) return false;
  return (
    isPrimaryDealer(profile) &&
    hasPermission(profile.permissions, PERMISSION.settingsManage, {
      isSuperRole: profile.isSuperRole,
    })
  );
}

export function profileHas(
  profile: SessionPayload | null | undefined,
  key: string,
): boolean {
  if (!profile) return false;
  return hasPermission(profile.permissions, key, { isSuperRole: profile.isSuperRole });
}

export function resolvePrimaryDealerPermissions(): string[] {
  return [...ALL_DEALER_PERMISSIONS];
}
