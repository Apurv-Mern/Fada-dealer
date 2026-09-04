import type { StaffMember, StaffRole } from "@/features/dealer-staff/types";

export const mockStaffRoles: StaffRole[] = [
  {
    id: "1",
    name: "Dealer Admin",
    key: "dealer_admin",
    isSuperRole: true,
  },
  {
    id: "2",
    name: "Dealer Manager",
    key: "dealer_manager",
  },
  {
    id: "3",
    name: "Dealer Viewer",
    key: "dealer_viewer",
  },
  {
    id: "4",
    name: "Sales Lead",
    key: "dealer_sales_lead",
  },
];

export let mockStaffMembers: StaffMember[] = [
  {
    id: "101",
    name: "Priya Shah",
    email: "priya@sundaram.com",
    phone: "9876500001",
    roleId: "2",
    role: mockStaffRoles[1]!,
    isActive: true,
    isEmailVerified: true,
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "102",
    name: "Amit Rao",
    email: "amit@sundaram.com",
    phone: "9876500002",
    roleId: "3",
    role: mockStaffRoles[2]!,
    isActive: true,
    isEmailVerified: true,
    createdAt: "2025-06-02T00:00:00.000Z",
  },
  {
    id: "103",
    name: "Neha Iyer",
    email: "neha@sundaram.com",
    phone: "9876500003",
    roleId: "4",
    role: mockStaffRoles[3]!,
    isActive: false,
    isEmailVerified: true,
    createdAt: "2025-09-18T00:00:00.000Z",
  },
];

export function resetMockStaffMembers(
  next: StaffMember[] = mockStaffMembers.map((member) => ({ ...member })),
) {
  mockStaffMembers = next;
}

export function addMockStaffMember(member: StaffMember) {
  mockStaffMembers = [{ ...member }, ...mockStaffMembers];
}

export function updateMockStaffMember(id: string, next: StaffMember) {
  mockStaffMembers = mockStaffMembers.map((row) =>
    row.id === id ? next : row,
  );
}

export function removeMockStaffMember(id: string) {
  mockStaffMembers = mockStaffMembers.filter((row) => row.id !== id);
}

export function getMockStaffRole(id: string): StaffRole | undefined {
  return mockStaffRoles.find((role) => role.id === id);
}
