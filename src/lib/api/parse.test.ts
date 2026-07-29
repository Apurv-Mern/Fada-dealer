import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import {
  buildQuery,
  normalizeListPayload,
  parseListResult,
  parseWithSchema,
} from "@/lib/api/parse";
import { mapOutletToBranch } from "@/features/branches/api";
import { employeeSchema, employeeStatsSchema } from "@/features/employees/schemas";
import { branchDashboardSchema } from "@/features/branches/schemas";

describe("buildQuery", () => {
  it("omits empty values and prefixes ?", () => {
    expect(buildQuery({ page: 1, q: "", branchId: undefined })).toBe("?page=1");
    expect(buildQuery({})).toBe("");
  });
});

describe("normalizeListPayload", () => {
  it("parses dealer outlets envelope with pagination", () => {
    const result = normalizeListPayload(
      {
        success: true,
        message: "Outlets fetched successfully",
        data: {
          outlets: [
            {
              id: 1,
              name: "test101",
              code: "123654",
              city: "Wicksburg",
              state: "AL",
              address: "1695 Franklin Street",
              isActive: true,
              functions: [],
            },
          ],
          pagination: { total: 1, limit: 100, offset: 0 },
        },
      },
      { page: 1, pageSize: 20 },
    );

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.pageSize).toBe(100);
    expect(result.page).toBe(1);

    const branch = mapOutletToBranch(result.items[0]);
    expect(branch.id).toBe("1");
    expect(branch.name).toBe("test101");
    expect(branch.status).toBe("Active");
    expect(branch.location).toContain("Wicksburg");
  });
});

describe("parseListResult", () => {
  it("parses a valid list", () => {
    const result = parseListResult(
      {
        items: [
          {
            id: "1",
            name: "A",
            email: "a@b.com",
            phone: "1",
            fadaId: "X",
            branch: "B",
            branchId: "b",
            designation: "D",
            designationId: "d",
            status: "Active",
            fadaScore: 800,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      },
      employeeSchema,
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("throws ApiError on invalid shape instead of soft-empty", () => {
    expect(() => parseListResult({ items: null }, employeeSchema)).toThrow(
      ApiError,
    );
  });
});

describe("parseWithSchema", () => {
  it("parses employee stats", () => {
    const stats = parseWithSchema(
      { total: 1, active: 1, newJoins: 0, exited: 0 },
      employeeStatsSchema,
    );
    expect(stats.total).toBe(1);
  });

  it("throws on bad dashboard", () => {
    expect(() => parseWithSchema({}, branchDashboardSchema)).toThrow(ApiError);
  });
});
