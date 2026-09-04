import { describe, expect, it } from "vitest";

import {
  canAccessSettings,
  canManageRoles,
  hasPermission,
  isPrimaryDealer,
  PERMISSION,
} from "@/features/auth/permissions";
import type { SessionPayload } from "@/features/auth/auth-utils";

const primaryDealer: SessionPayload = {
  email: "owner@dealer.com",
  name: "Owner",
  roleLabel: "Dealer Admin",
  userType: "dealer",
  permissions: [],
  isSuperRole: true,
};

const staffViewer: SessionPayload = {
  email: "viewer@dealer.com",
  name: "Viewer",
  roleLabel: "Dealer Viewer",
  userType: "staff",
  roleId: 3,
  permissions: [PERMISSION.dashboardView, PERMISSION.employeesView],
  isSuperRole: false,
};

describe("permissions", () => {
  it("grants all permissions to super role", () => {
    expect(hasPermission([], PERMISSION.outletsManage, { isSuperRole: true })).toBe(
      true,
    );
  });

  it("identifies primary dealer", () => {
    expect(isPrimaryDealer(primaryDealer)).toBe(true);
    expect(isPrimaryDealer(staffViewer)).toBe(false);
  });

  it("allows settings access with staff view or settings manage", () => {
    expect(canAccessSettings(primaryDealer)).toBe(true);
    expect(
      canAccessSettings({
        ...staffViewer,
        permissions: [PERMISSION.staffView],
      }),
    ).toBe(true);
    expect(
      canAccessSettings({
        ...staffViewer,
        permissions: [PERMISSION.dashboardView],
      }),
    ).toBe(false);
  });

  it("restricts role management to primary dealer with settings manage", () => {
    expect(canManageRoles(primaryDealer)).toBe(true);
    expect(canManageRoles(staffViewer)).toBe(false);
  });
});
