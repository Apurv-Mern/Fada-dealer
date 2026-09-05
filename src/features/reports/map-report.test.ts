import { describe, expect, it } from "vitest";

import {
  buildReportApiQuery,
  deriveRowColumns,
  extractBreakdownCharts,
  formatCellValue,
  formatColumnLabel,
  formatReportDate,
  formatScalarDisplay,
  getReportCellValue,
  getVisibleReportFilters,
  mapReportFiltersMetadata,
  mapReportResult,
  mergeBreakdownSources,
  normalizeReportRow,
  partitionReportSummary,
  reportExportParams,
  resolveCompanyName,
  sanitizeReportQueryForKey,
} from "@/features/reports/map-report";
import { emptyReportUrlQuery } from "@/features/reports/types";

describe("buildReportApiQuery", () => {
  it("maps page/pageSize to limit/offset and omits empty filters", () => {
    expect(buildReportApiQuery({ page: 2, pageSize: 25 })).toEqual({
      search: undefined,
      fromDate: undefined,
      toDate: undefined,
      departmentId: undefined,
      designationId: undefined,
      employmentStatus: undefined,
      fadaIdStatus: undefined,
      profileStatus: undefined,
      verificationStatus: undefined,
      membershipStatus: undefined,
      stage: undefined,
      eventType: undefined,
      format: undefined,
      limit: 25,
      offset: 25,
    });
  });

  it("forwards search when provided", () => {
    expect(buildReportApiQuery({ search: "FADA-DR-123" })).toMatchObject({
      search: "FADA-DR-123",
    });
    expect(buildReportApiQuery({ search: "" })).toMatchObject({
      search: undefined,
    });
  });

  it("defaults pageSize to 50 per Swagger", () => {
    expect(buildReportApiQuery({ page: 1 })).toMatchObject({
      limit: 50,
      offset: 0,
    });
  });

  it("forwards Swagger status and report-specific filters", () => {
    expect(
      buildReportApiQuery({
        employmentStatus: "active",
        verificationStatus: "pending",
        stage: "registered",
        eventType: "exit",
      }),
    ).toMatchObject({
      employmentStatus: "active",
      verificationStatus: "pending",
      stage: "registered",
      eventType: "exit",
    });
  });

  it("excludes pagination when exporting", () => {
    expect(
      buildReportApiQuery(
        { page: 3, pageSize: 10, fromDate: "2026-01-01", format: "xlsx" },
        { includePagination: false },
      ),
    ).toEqual({
      search: undefined,
      fromDate: "2026-01-01",
      toDate: undefined,
      departmentId: undefined,
      designationId: undefined,
      employmentStatus: undefined,
      fadaIdStatus: undefined,
      profileStatus: undefined,
      verificationStatus: undefined,
      membershipStatus: undefined,
      stage: undefined,
      eventType: undefined,
      format: "xlsx",
    });
  });
});

describe("getVisibleReportFilters", () => {
  it("includes search on all report tabs", () => {
    expect(getVisibleReportFilters("workforce-analytics")).toContain("search");
    expect(getVisibleReportFilters("employee-master")).toContain("search");
  });

  it("includes report-specific filters per Swagger", () => {
    expect(getVisibleReportFilters("onboarding-verification")).toContain(
      "verificationStatus",
    );
    expect(getVisibleReportFilters("onboarding-verification")).toContain("stage");
    expect(getVisibleReportFilters("employee-movement")).toContain("eventType");
    expect(getVisibleReportFilters("employee-master")).toContain(
      "employmentStatus",
    );
    expect(getVisibleReportFilters("workforce-analytics")).not.toContain(
      "eventType",
    );
  });
});

describe("sanitizeReportQueryForKey", () => {
  it("clears filters that do not apply to the active report tab", () => {
    const query = {
      ...emptyReportUrlQuery(),
      eventType: "exit",
      employmentStatus: "active",
      fromDate: "2026-01-01",
    };

    const sanitized = sanitizeReportQueryForKey("workforce-analytics", query);

    expect(sanitized.fromDate).toBe("2026-01-01");
    expect(sanitized.eventType).toBe("");
    expect(sanitized.employmentStatus).toBe("");
  });
});

describe("reportExportParams", () => {
  it("exports only filters valid for the selected report key", () => {
    const params = reportExportParams("employee-movement", {
      ...emptyReportUrlQuery(),
      fromDate: "2026-01-01",
      eventType: "exit",
      employmentStatus: "active",
    });

    expect(params).toEqual({
      fromDate: "2026-01-01",
      toDate: undefined,
      departmentId: undefined,
      designationId: undefined,
      employmentStatus: undefined,
      fadaIdStatus: undefined,
      profileStatus: undefined,
      verificationStatus: undefined,
      membershipStatus: undefined,
      stage: undefined,
      eventType: "exit",
    });
  });

  it("excludes search from export params", () => {
    const params = reportExportParams("employee-master", {
      ...emptyReportUrlQuery(),
      search: "rahul",
      fromDate: "2026-01-01",
    });

    expect(params).not.toHaveProperty("search");
    expect(params.fromDate).toBe("2026-01-01");
  });
});

describe("partitionReportSummary", () => {
  it("separates scalar KPIs from breakdown arrays in summary", () => {
    const { scalars, breakdownsFromSummary } = partitionReportSummary({
      totalEmployees: 18,
      byDepartment: [{ name: "Sales", count: 5 }],
      stages: [{ stage: "registered", count: 3 }],
    });

    expect(scalars).toEqual({ totalEmployees: 18 });
    expect(breakdownsFromSummary.byDepartment).toHaveLength(1);
    expect(breakdownsFromSummary.stages).toHaveLength(1);
  });

  it("never produces object object strings for scalar display keys", () => {
    const { scalars } = partitionReportSummary({
      totalEmployees: 18,
      byDepartment: [{ name: "Sales", count: 5 }],
    });

    for (const value of Object.values(scalars)) {
      expect(String(value)).not.toContain("[object Object]");
    }
  });
});

describe("mergeBreakdownSources", () => {
  it("merges summary breakdowns with API breakdowns", () => {
    const merged = mergeBreakdownSources(
      { byOutlet: [{ label: "Central", value: 2 }] },
      { byDepartment: [{ label: "Sales", value: 5 }] },
    );

    expect(merged.byDepartment).toBeDefined();
    expect(merged.byOutlet).toBeDefined();
  });
});

describe("mapReportFiltersMetadata", () => {
  it("unwraps catalog and filter options", () => {
    const result = mapReportFiltersMetadata({
      success: true,
      data: {
        reports: [
          {
            key: "employee-master",
            name: "Employee Master",
            description: "Roster",
          },
        ],
        departments: [{ id: 1, name: "Sales" }],
        designations: [{ id: 10, name: "Advisor" }],
      },
    });

    expect(result.reports).toHaveLength(1);
    expect(result.reports[0]?.key).toBe("employee-master");
    expect(result.departments).toEqual([{ label: "Sales", value: "1" }]);
    expect(result.designations).toEqual([{ label: "Advisor", value: "10" }]);
  });

  it("falls back to default dealer report keys when catalog is missing", () => {
    const result = mapReportFiltersMetadata({ success: true, data: {} });
    expect(result.reports).toHaveLength(5);
    expect(result.reports[0]?.key).toBe("employee-master");
  });
});

describe("mapReportResult", () => {
  it("maps summary scalars, merged breakdowns, and pagination offset to page", () => {
    const result = mapReportResult(
      {
        success: true,
        data: {
          meta: {
            reportKey: "workforce-analytics",
            reportName: "Workforce Analytics",
            generatedAt: "2026-08-26T10:00:00.000Z",
          },
          summary: {
            totalEmployees: 42,
            byDepartment: [{ name: "Sales", count: 10 }],
          },
          rows: [{ name: "Priya", status: "Active" }],
          breakdowns: {
            byDesignation: [{ label: "Advisor", value: 4 }],
          },
          pagination: { total: 100, limit: 20, offset: 40 },
        },
      },
      { page: 1, pageSize: 10 },
    );

    expect(result.meta.reportName).toBe("Workforce Analytics");
    expect(result.summaryScalars).toEqual({ totalEmployees: 42 });
    expect(result.breakdowns.byDepartment).toBeDefined();
    expect(result.breakdowns.byDesignation).toBeDefined();
    expect(result.rows).toHaveLength(1);
    expect(result.total).toBe(100);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(20);
  });

  it("normalizes nested dealership name into dealerName rows", () => {
    const result = mapReportResult(
      {
        success: true,
        data: {
          rows: [
            {
              name: "Farhan Kumar",
              dealerName: "",
              dealership: { name: "Alex motor showroom" },
            },
          ],
        },
      },
      { page: 1, pageSize: 10 },
    );

    expect(result.rows[0]?.dealerName).toBe("Alex motor showroom");
  });
});

describe("formatColumnLabel", () => {
  it("maps dealerName to Company Name", () => {
    expect(formatColumnLabel("dealerName")).toBe("Company Name");
  });

  it("falls back to formatSummaryLabel for other keys", () => {
    expect(formatColumnLabel("fadaId")).toBe("Fada Id");
  });
});

describe("resolveCompanyName", () => {
  it("reads nested dealership.name when dealerName is empty", () => {
    expect(
      resolveCompanyName({
        dealerName: "",
        dealership: { name: "Alex motor showroom" },
      }),
    ).toBe("Alex motor showroom");
  });

  it("prefers explicit dealerName over nested dealership", () => {
    expect(
      resolveCompanyName({
        dealerName: "Primary Co",
        dealership: { name: "Nested Co" },
      }),
    ).toBe("Primary Co");
  });
});

describe("normalizeReportRow", () => {
  it("injects dealerName from nested dealership", () => {
    expect(
      normalizeReportRow({
        name: "Farhan Kumar",
        dealership: { name: "Alex motor showroom" },
      }),
    ).toEqual({
      name: "Farhan Kumar",
      dealership: { name: "Alex motor showroom" },
      dealerName: "Alex motor showroom",
    });
  });
});

describe("getReportCellValue", () => {
  it("returns resolved company name for dealerName column", () => {
    expect(
      getReportCellValue(
        { dealerName: "", dealership: { name: "Alex motor showroom" } },
        "dealerName",
      ),
    ).toBe("Alex motor showroom");
  });
});

describe("deriveRowColumns", () => {
  it("skips nested objects and internal ids", () => {
    expect(
      deriveRowColumns([
        {
          id: 1,
          name: "Priya",
          outlet: { name: "Central" },
          status: "Active",
        },
      ]),
    ).toEqual(["name", "status"]);
  });
});

describe("extractBreakdownCharts", () => {
  it("builds bar chart series from array breakdowns", () => {
    const charts = extractBreakdownCharts({
      byDepartment: [
        { label: "Sales", value: 12 },
        { label: "Service", value: 8 },
      ],
    });
    expect(charts).toHaveLength(1);
    expect(charts[0]?.items).toHaveLength(2);
    expect(charts[0]?.items[0]?.label).toBe("Sales");
  });

  it("reads stage and count fields from API-shaped items", () => {
    const charts = extractBreakdownCharts({
      stages: [{ stage: "registered", count: 5 }],
    });
    expect(charts[0]?.title).toBe("Onboarding stages");
    expect(charts[0]?.items[0]?.label).toBe("Registered");
    expect(charts[0]?.items[0]?.value).toBe(5);
  });

  it("formats slug stage values for display", () => {
    const charts = extractBreakdownCharts({
      stages: [{ stage: "company-name", count: 5 }],
    });
    expect(charts[0]?.items[0]?.label).toBe("Company name");
  });

  it("preserves human-readable name fields", () => {
    const charts = extractBreakdownCharts({
      byOutlet: [{ name: "Central Showroom", count: 3 }],
    });
    expect(charts[0]?.items[0]?.label).toBe("Central Showroom");
  });
});

describe("formatCellValue", () => {
  it("formats ISO date columns", () => {
    const formatted = formatCellValue(
      "2026-08-12T09:23:48.000Z",
      "registrationDate",
    );
    expect(formatted).not.toContain("T09:23:48");
    expect(formatted).toMatch(/2026/);
  });

  it("formats array cells as comma-separated labels", () => {
    expect(
      formatCellValue([{ name: "Sales" }, { name: "Service" }], "departments"),
    ).toBe("Sales, Service");
  });

  it("formats eventType slug values for employee movement", () => {
    expect(formatCellValue("new_joiner", "eventType")).toBe("New joiner");
    expect(formatCellValue("exit", "eventType")).toBe("Exit");
    expect(formatCellValue("status_change", "eventType")).toBe("Status change");
  });

  it("formats statusDetail slug values as readable labels", () => {
    expect(formatCellValue("accept_resignation", "statusDetail")).toBe(
      "Accept resignation",
    );
    expect(formatCellValue("Handover completed", "statusDetail")).toBe(
      "Handover completed",
    );
  });

  it("leaves non-keyword columns unchanged", () => {
    expect(formatCellValue("new_joiner", "name")).toBe("new_joiner");
  });
});

describe("formatReportDate", () => {
  it("returns readable en-IN dates", () => {
    expect(formatReportDate("2026-08-12T09:23:48.000Z")).toMatch(/12/);
  });
});

describe("formatScalarDisplay", () => {
  it("appends percent sign for coverage metrics", () => {
    expect(formatScalarDisplay("coveragePercentage", 100)).toBe("100%");
  });
});
