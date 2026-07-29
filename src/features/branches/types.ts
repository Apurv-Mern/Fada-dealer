import type { ListParams } from "@/types/api";

export const BRANCH_TYPES = ["Sales", "Service", "Sales & Service"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

export const BRANCH_STATUSES = ["Active", "Inactive"] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

export type Branch = {
  id: string;
  name: string;
  location: string;
  type: BranchType;
  employees: number;
  active: number;
  fadaScore: number;
  status: BranchStatus;
  /** Optional raw outlet fields for edit forms. */
  code?: string;
  manager?: string;
  city?: string;
  state?: string;
  address?: string;
  pinCode?: string;
  isActive?: boolean;
};

export type OutletInput = {
  name: string;
  code?: string;
  manager?: string;
  pinCode?: string;
  city?: string;
  state?: string;
  address?: string;
  functions?: Array<string | number>;
  isActive?: boolean;
};

export type OutletOption = {
  value: string;
  label: string;
};

export type BranchStats = {
  totalBranches: number;
  activeBranches: number;
  totalEmployees: number;
  avgFadaScore: number;
};

export type ChartSlice = {
  label: string;
  value: number;
  color: string;
};

export type PerformanceTile = {
  label: string;
  value: number;
  tone: "green" | "red" | "orange" | "blue";
};

export type BranchDashboard = {
  stats: BranchStats;
  branches: Branch[];
  employeesByBranch: ChartSlice[];
  branchScores: ChartSlice[];
  branchPerformance: PerformanceTile[];
};

export type BranchListParams = ListParams & {
  isActive?: boolean;
};
