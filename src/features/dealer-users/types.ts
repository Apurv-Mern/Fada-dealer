export const DEALER_USER_ROLES = ["dealer_admin", "hr", "viewer"] as const;
export type DealerUserRole = (typeof DEALER_USER_ROLES)[number];

export const ROLE_LABELS: Record<DealerUserRole, string> = {
  dealer_admin: "Company Admin",
  hr: "HR",
  viewer: "Viewer",
};

export type DealerUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: DealerUserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
};

export type DealerUserInput = {
  name: string;
  email?: string;
  phone: string;
  role: DealerUserRole;
  isActive?: boolean;
};

export type DealerUserListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  isActive?: boolean;
};

export type DealerUserPageData = {
  list: {
    items: DealerUser[];
    total: number;
    page: number;
    pageSize: number;
  };
  /** Active dealer_admin count across the tenant (for last-admin guard). */
  activeAdminCount: number;
};

export function parseUserRole(value: string | null | undefined): DealerUserRole {
  if (value === "dealer_admin" || value === "hr" || value === "viewer") {
    return value;
  }
  return "viewer";
}

export function formatLastLogin(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
