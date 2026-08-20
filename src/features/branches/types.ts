import type { ListParams } from "@/types/api";

/** Legacy fixed labels; listing now shows full joined master names. */
export const BRANCH_TYPES = ["Sales", "Service", "Sales & Service", "—"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number] | (string & {});

export const BRANCH_STATUSES = ["Active", "Inactive"] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

export type Branch = {
  id: string;
  name: string;
  location: string;
  /** Comma-joined outlet function names from masters (or "—"). */
  type: string;
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
  brandId?: number;
  brandName?: string;
  functionIds?: Array<string | number>;
  /** Mock / filter helper — group holding dealer id. */
  groupDealerId?: string;
};

export type OutletInput = {
  name: string;
  brandId: number;
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

export type GroupDealer = {
  id: string;
  name: string;
  dealerCode?: string;
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
  groupDealerId?: string | number;
};
