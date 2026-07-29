import { z } from "zod";

import { EMPLOYEE_STATUSES } from "@/features/employees/types";

export const employeeStatusSchema = z.enum(EMPLOYEE_STATUSES);

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  fadaId: z.string(),
  branch: z.string(),
  branchId: z.string(),
  designation: z.string(),
  designationId: z.string(),
  status: employeeStatusSchema,
  fadaScore: z.number(),
});

export const employeeStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  newJoins: z.number(),
  exited: z.number(),
});

export const filterOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const employeeFilterOptionsSchema = z.object({
  branches: z.array(filterOptionSchema),
  designations: z.array(filterOptionSchema),
});
