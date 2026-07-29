import type {
  Branch,
  BranchStats,
  ChartSlice,
  PerformanceTile,
} from "@/features/branches/types";

export const branchStats: BranchStats = {
  totalBranches: 4,
  activeBranches: 4,
  totalEmployees: 248,
  avgFadaScore: 842,
};

export const branches: Branch[] = [
  {
    id: "1",
    name: "Andheri West Showroom",
    location: "Mumbai, MH",
    type: "Sales & Service",
    employees: 86,
    active: 81,
    fadaScore: 910,
    status: "Active",
  },
  {
    id: "2",
    name: "Pune Service Hub",
    location: "Pune, MH",
    type: "Service",
    employees: 54,
    active: 50,
    fadaScore: 870,
    status: "Active",
  },
  {
    id: "3",
    name: "Thane Sales Outlet",
    location: "Thane, MH",
    type: "Sales",
    employees: 62,
    active: 58,
    fadaScore: 820,
    status: "Active",
  },
  {
    id: "4",
    name: "Nashik Branch",
    location: "Nashik, MH",
    type: "Sales & Service",
    employees: 46,
    active: 42,
    fadaScore: 768,
    status: "Active",
  },
];

export const employeesByBranch: ChartSlice[] = [
  { label: "Andheri West", value: 86, color: "#e85d04" },
  { label: "Pune Service", value: 54, color: "#2563eb" },
  { label: "Thane Sales", value: 62, color: "#16a34a" },
  { label: "Nashik", value: 46, color: "#7c3aed" },
];

export const branchScores: ChartSlice[] = [
  { label: "Andheri", value: 910, color: "#e85d04" },
  { label: "Pune", value: 870, color: "#2563eb" },
  { label: "Thane", value: 820, color: "#16a34a" },
  { label: "Nashik", value: 768, color: "#7c3aed" },
];

export const branchPerformance: PerformanceTile[] = [
  { label: "Total Joins", value: 28, tone: "green" },
  { label: "Exits", value: 6, tone: "red" },
  { label: "On Notice", value: 9, tone: "orange" },
  { label: "Docs Verified", value: 214, tone: "blue" },
];
