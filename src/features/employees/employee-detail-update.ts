import type { EmployeeDetail, EmployeeInput } from "@/features/employees/types";

export type EmployeeDetailUpdateOverrides = Partial<{
  name: string;
  email: string | undefined;
  phone: string | undefined;
  departmentId: string | undefined;
  designationId: string | undefined;
  joinedDate: string | undefined;
  outletId: string | undefined;
  score: number;
  isActive: boolean;
}>;

export function stripPhonePrefix(phone: string): string {
  return phone.replace(/^\+91\s*/i, "").trim();
}

export function toApiPhone(local: string): string | undefined {
  const trimmed = local.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("+")) return trimmed;
  return `+91 ${trimmed}`;
}

export function employeeToUpdateInput(
  employee: EmployeeDetail,
  overrides: EmployeeDetailUpdateOverrides = {},
): EmployeeInput {
  return {
    name: overrides.name ?? employee.name,
    email: "email" in overrides ? overrides.email : employee.email || undefined,
    phone: "phone" in overrides ? overrides.phone : employee.phone || undefined,
    score: overrides.score ?? employee.fadaScore,
    joinedDate:
      "joinedDate" in overrides ? overrides.joinedDate : employee.joinedDate,
    isActive:
      overrides.isActive ??
      (employee.isActive !== false && employee.status !== "Inactive"),
    outletId:
      "outletId" in overrides ? overrides.outletId : employee.branchId || undefined,
    departmentId:
      "departmentId" in overrides ? overrides.departmentId : employee.departmentId,
    designationId:
      "designationId" in overrides
        ? overrides.designationId
        : employee.designationId,
    assignmentId: employee.assignmentId,
  };
}
