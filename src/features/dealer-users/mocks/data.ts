import type { DealerUser } from "@/features/dealer-users/types";

export let mockDealerUsers: DealerUser[] = [
  {
    id: "1",
    name: "Priya Shah",
    email: "priya@sundaram.com",
    phone: "9876500001",
    role: "dealer_admin",
    isActive: true,
    lastLoginAt: "2026-03-11T08:12:00.000Z",
    createdAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Amit Rao",
    email: "amit@sundaram.com",
    phone: "9876500002",
    role: "hr",
    isActive: true,
    lastLoginAt: "2026-03-10T11:40:00.000Z",
    createdAt: "2025-06-02T00:00:00.000Z",
  },
  {
    id: "3",
    name: "Neha Iyer",
    email: "neha@sundaram.com",
    phone: "9876500003",
    role: "viewer",
    isActive: false,
    lastLoginAt: "2026-02-01T09:00:00.000Z",
    createdAt: "2025-09-18T00:00:00.000Z",
  },
];

export function resetMockDealerUsers(
  next: DealerUser[] = mockDealerUsers.map((u) => ({ ...u })),
) {
  mockDealerUsers = next;
}

export function addMockDealerUser(user: DealerUser) {
  mockDealerUsers = [{ ...user }, ...mockDealerUsers];
}

export function updateMockDealerUser(id: string, next: DealerUser) {
  mockDealerUsers = mockDealerUsers.map((row) => (row.id === id ? next : row));
}

export function countActiveAdmins(exceptId?: string): number {
  return mockDealerUsers.filter(
    (u) =>
      u.role === "dealer_admin" &&
      u.isActive &&
      (exceptId ? u.id !== exceptId : true),
  ).length;
}
