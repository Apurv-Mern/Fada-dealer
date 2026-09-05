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
  /** Public outlet code (OT######) from API — read-only in UI. */
  outletCode?: string;
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
  /** Public outlet code (OT######) when returned by the API. */
  outletCode?: string;
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

/** Single row for POST /dealers/outlets/import (Swagger DealerOutletImportItem). */
export type OutletImportItem = {
  name: string;
  brandName: string;
  outletFunctions: string[];
  manager?: string;
  pincode?: string;
  city?: string;
  state?: string;
  address?: string;
};

export type OutletImportSkipReason =
  | "Outlet already exists"
  | "Brand not found";

export type OutletImportSkippedRow = OutletImportItem & {
  reason: OutletImportSkipReason | string;
  /** Attached client-side when mapping API skipped rows back to CSV rows. */
  row?: number;
};

export type OutletImportRowError = {
  row: number;
  message: string;
};

export type OutletImportResult = {
  total: number;
  created: number;
  failed: number;
  errors: OutletImportRowError[];
};
