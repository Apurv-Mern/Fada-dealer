import type {
  ReportCatalogItem,
  ReportFiltersMetadata,
  ReportResult,
} from "@/features/reports/types";

export const mockReportCatalog: ReportCatalogItem[] = [
  {
    key: "employee-master",
    name: "Employee Master",
    description: "Roster of employees under your dealership with assignment details.",
  },
  {
    key: "onboarding-verification",
    name: "Onboarding & Verification",
    description: "Track onboarding progress and document verification status.",
  },
  {
    key: "employee-movement",
    name: "Employee Movement",
    description: "Joining, transfer, and exit activity across outlets.",
  },
  {
    key: "workforce-analytics",
    name: "Workforce Analytics",
    description: "Headcount and workforce composition breakdowns.",
  },
  {
    key: "adoption-compliance",
    name: "Adoption & Compliance",
    description: "Profile completion and compliance adoption metrics.",
  },
];

export const mockReportFilters: ReportFiltersMetadata = {
  reports: mockReportCatalog,
  departments: [
    { label: "Sales", value: "1" },
    { label: "Service", value: "2" },
  ],
  designations: [
    { label: "Advisor", value: "10" },
    { label: "Technician", value: "11" },
  ],
};

export function buildMockReportResult(reportKey: string): ReportResult {
  return {
    meta: {
      reportKey,
      reportName:
        mockReportCatalog.find((r) => r.key === reportKey)?.name ?? reportKey,
      portal: "dealer",
      generatedAt: new Date().toISOString(),
      filtersApplied: {},
    },
    summary: {
      totalEmployees: 128,
      activeEmployees: 112,
      pendingVerification: 6,
      inactiveEmployees: 10,
    },
    summaryScalars: {
      totalEmployees: 128,
      activeEmployees: 112,
      pendingVerification: 6,
      inactiveEmployees: 10,
    },
    rows: [
      {
        fadaId: "FADA-DF-10001",
        name: "Priya Sharma",
        outlet: "Central Showroom",
        department: "Sales",
        designation: "Advisor",
        status: "Active",
      },
      {
        fadaId: "FADA-DF-10002",
        name: "Rahul Mehta",
        outlet: "West Service",
        department: "Service",
        designation: "Technician",
        status: "Active",
      },
      {
        fadaId: "FADA-DF-10003",
        name: "Anita Desai",
        outlet: "Central Showroom",
        department: "Sales",
        designation: "Advisor",
        status: "Pending",
      },
    ],
    breakdowns: {
      byDepartment: [
        { label: "Sales", value: 72 },
        { label: "Service", value: 41 },
        { label: "Admin", value: 15 },
      ],
    },
    total: 3,
    page: 1,
    pageSize: 10,
  };
}
