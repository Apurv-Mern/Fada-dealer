import { describe, expect, it } from "vitest";

import {
  employeeToUpdateInput,
  stripPhonePrefix,
  toApiPhone,
} from "@/features/employees/employee-detail-update";
import type { EmployeeDetail } from "@/features/employees/types";

const baseEmployee: EmployeeDetail = {
  id: "41",
  name: "dev new",
  email: "devmailnew@gmail.com",
  phone: "+91 6201050668",
  fadaId: "FADA-CB-46698",
  branch: "test-ram",
  branchId: "6",
  designation: "SD5",
  designationId: "8",
  departmentId: "2",
  assignmentId: "36",
  status: "Active",
  fadaScore: 10,
  isActive: true,
  joinedDate: "2026-08-12",
};

describe("stripPhonePrefix", () => {
  it("removes +91 prefix", () => {
    expect(stripPhonePrefix("+91 6201050668")).toBe("6201050668");
  });
});

describe("toApiPhone", () => {
  it("formats local digits with +91", () => {
    expect(toApiPhone("6201050668")).toBe("+91 6201050668");
  });

  it("returns undefined for empty input", () => {
    expect(toApiPhone("")).toBeUndefined();
  });
});

describe("employeeToUpdateInput", () => {
  it("maps full employee detail to update input", () => {
    expect(employeeToUpdateInput(baseEmployee)).toEqual({
      name: "dev new",
      email: "devmailnew@gmail.com",
      phone: "+91 6201050668",
      score: 10,
      joinedDate: "2026-08-12",
      isActive: true,
      outletId: "6",
      departmentId: "2",
      designationId: "8",
      assignmentId: "36",
    });
  });

  it("merges partial overrides without dropping other fields", () => {
    expect(
      employeeToUpdateInput(baseEmployee, {
        email: "updated@example.com",
      }),
    ).toEqual({
      name: "dev new",
      email: "updated@example.com",
      phone: "+91 6201050668",
      score: 10,
      joinedDate: "2026-08-12",
      isActive: true,
      outletId: "6",
      departmentId: "2",
      designationId: "8",
      assignmentId: "36",
    });
  });

  it("allows clearing optional email via override", () => {
    expect(
      employeeToUpdateInput(baseEmployee, {
        email: undefined,
      }),
    ).toMatchObject({
      email: undefined,
      name: "dev new",
    });
  });
});
