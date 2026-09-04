export type StaffRole = {
  id: string;
  name: string;
  key: string;
  description?: string;
  isSuperRole?: boolean;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  role: StaffRole;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type StaffCreateInput = {
  name: string;
  email: string;
  phone: string;
  roleId: string;
  password: string;
  confirmPassword: string;
  isActive?: boolean;
};

export type StaffUpdateInput = {
  name: string;
  email: string;
  phone: string;
  roleId: string;
  password?: string;
  confirmPassword?: string;
  isActive?: boolean;
};

export type StaffListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  roleId?: string;
  isActive?: boolean;
};

export type StaffPageData = {
  list: {
    items: StaffMember[];
    total: number;
    page: number;
    pageSize: number;
  };
};

export function formatStaffDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}
