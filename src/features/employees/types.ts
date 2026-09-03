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
  departmentId?: string;
  /** Current EmployeeAssignment id used for list display and PUT targeting. */
  assignmentId?: string;
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
  departmentId?: string;
  designationId?: string;
  /** When set on update, sent as assignment.id so PUT targets the current row. */
  assignmentId?: string;
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

/** Single row for POST /dealers/employees/import (Swagger DealerEmployeeImportItem). */
export type EmployeeImportItem = {
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  outletCode: string;
  startDate: string;
};

export type EmployeeImportSkipReason =
  | "Employee already working presently."
  | "Outlet not found"
  | "Department not found"
  | "Designation not found";

export type EmployeeImportSkippedRow = EmployeeImportItem & {
  reason: EmployeeImportSkipReason | string;
  /** Attached client-side when mapping API skipped rows back to CSV rows. */
  row?: number;
};

export type EmployeeImportRowError = {
  row: number;
  message: string;
};

export type EmployeeImportResult = {
  total: number;
  created: number;
  failed: number;
  errors: EmployeeImportRowError[];
};

export type EmployeeTransferInput = {
  employeeId: string;
  fromOutletId: string;
  outletId: string;
  departmentId: string;
  designationId: string;
};

/** Result row from GET /dealers/employees/joining (invite / rejoin search). */
export type EmployeeJoiningCandidate = {
  id: string;
  fadaId: string;
  name: string;
  email: string;
  phone: string;
};

export type EmployeeExperience = {
  id: string;
  title: string;
  subtitle?: string;
  company: string;
  isCurrent?: boolean;
  startDate?: string;
  endDate?: string;
  employmentType?: string;
  highlights?: string;
};

/** Certificates, trainings, appreciations, promotions, or structured skills. */
export type EmployeeJourneyItem = {
  id: string;
  title: string;
  meta?: string;
  date?: string;
  description?: string;
  attachmentUrl?: string;
};

export type EmployeeDocumentStatus = "pending" | "approved" | "rejected";

export type EmployeeDocument = {
  id: string;
  name: string;
  isMandatory: boolean;
  isUploaded: boolean;
  status?: EmployeeDocumentStatus;
  frontImageUrl?: string;
  backImageUrl?: string;
  reason?: string;
};

export type EmployeeDetail = Employee & {
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  bloodGroup?: string;
  address?: string;
  experienceYears?: string;
  qualification?: string;
  isQualificationVerified?: boolean;
  skills?: string[];
  languages?: string[];
  profilePictureUrl?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isKycCompleted?: boolean;
  dealershipName?: string;
  departmentName?: string;
  experiences?: EmployeeExperience[];
  certificates?: EmployeeJourneyItem[];
  trainings?: EmployeeJourneyItem[];
  appreciations?: EmployeeJourneyItem[];
  promotions?: EmployeeJourneyItem[];
  skillItems?: EmployeeJourneyItem[];
  journeys?: EmployeeJourneyItem[];
};

export type EmployeeDocumentStats = {
  uploaded: number;
  total: number;
  mandatoryUploaded: number;
  mandatoryTotal: number;
  mandatoryApproved: number;
};
