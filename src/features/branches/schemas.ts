import { z } from "zod";

import { BRANCH_STATUSES } from "@/features/branches/types";

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  type: z.string(),
  employees: z.number(),
  active: z.number(),
  fadaScore: z.number(),
  status: z.enum(BRANCH_STATUSES),
});

export const branchStatsSchema = z.object({
  totalBranches: z.number(),
  activeBranches: z.number(),
  totalEmployees: z.number(),
  avgFadaScore: z.number(),
});

export const chartSliceSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string(),
});

export const performanceTileSchema = z.object({
  label: z.string(),
  value: z.number(),
  tone: z.enum(["green", "red", "orange", "blue"]),
});

export const branchDashboardSchema = z.object({
  stats: branchStatsSchema,
  branches: z.array(branchSchema),
  employeesByBranch: z.array(chartSliceSchema),
  branchScores: z.array(chartSliceSchema),
  branchPerformance: z.array(performanceTileSchema),
});
