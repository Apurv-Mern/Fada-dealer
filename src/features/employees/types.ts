import type { ListParams } from "@/types/api";

export const EMPLOYEE_STATUSES = ["Active", "On Notice", "Inactive"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export function parseStatus(value: string | null): EmployeeStatus | "" {
  if (value === "Active" || value === "On Notice" || value === "Inactive") {
    return value;
  }
  return "";
}

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  fadaId: string;
  branch: string;
  branchId: string;
  designation: string;
  designationId: string;
  status: EmployeeStatus;
  fadaScore: number;
  isActive?: boolean;
  joinedDate?: string;
};

export type EmployeeInput = {
  name: string;
  email?: string;
  phone?: string;
  score?: number;
  joinedDate?: string;
  isActive?: boolean;
  outletId?: string;
};

export type EmployeeStats = {
  total: number;
  active: number;
  newJoins: number;
  exited: number;
};

export type EmployeeFilters = {
  branchId?: string;
  designationId?: string;
  status?: EmployeeStatus | "";
};

export type EmployeeListParams = ListParams & EmployeeFilters;

export type FilterOption = {
  label: string;
  value: string;
};

export type EmployeeFilterOptions = {
  branches: FilterOption[];
  designations: FilterOption[];
};
