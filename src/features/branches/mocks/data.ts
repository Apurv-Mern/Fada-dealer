import type {
  Branch,
  BranchStats,
  ChartSlice,
  GroupDealer,
  PerformanceTile,
} from "@/features/branches/types";

export const mockGroupDealers: GroupDealer[] = [
  { id: "1", name: "Company 1 — Sundaram Motors", dealerCode: "CMP-001" },
  { id: "2", name: "Company 2 — Western Auto", dealerCode: "CMP-002" },
];

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
    type: "Sales, Sales, Service, & Spares",
    employees: 86,
    active: 81,
    fadaScore: 910,
    status: "Active",
    city: "Mumbai",
    state: "Maharashtra",
    pinCode: "400058",
    address: "Andheri West",
    brandId: 1,
    brandName: "Honda",
    functionIds: [1, 4],
    isActive: true,
    groupDealerId: "1",
    outletCode: "OT583721",
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
    city: "Pune",
    state: "Maharashtra",
    pinCode: "411001",
    brandId: 2,
    brandName: "Maruti Suzuki",
    functionIds: [3],
    isActive: true,
    groupDealerId: "1",
    outletCode: "OT583722",
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
    city: "Thane",
    state: "Maharashtra",
    pinCode: "400601",
    brandId: 1,
    brandName: "Honda",
    functionIds: [1],
    isActive: true,
    groupDealerId: "2",
    outletCode: "OT583723",
  },
  {
    id: "4",
    name: "Nashik Branch",
    location: "Nashik, MH",
    type: "Sales, Service",
    employees: 46,
    active: 42,
    fadaScore: 768,
    status: "Active",
    city: "Nashik",
    state: "Maharashtra",
    pinCode: "422001",
    brandId: 3,
    brandName: "Toyota",
    functionIds: [1, 3],
    isActive: true,
    groupDealerId: "2",
    outletCode: "OT583724",
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
