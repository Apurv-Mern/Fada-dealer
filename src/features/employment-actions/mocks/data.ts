import type {
  EmploymentAction,
  EmploymentActionFilterOptions,
} from "@/features/employment-actions/types";
import { toIsoDate } from "@/features/employment-actions/types";

export const employmentActionFilterOptions: EmploymentActionFilterOptions = {
  branches: [
    { label: "Andheri West", value: "andheri" },
    { label: "Pune Service", value: "pune" },
    { label: "Thane Sales", value: "thane" },
  ],
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

function lastMonthDay(day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, day);
  return toIsoDate(d);
}

export const mockEmploymentActions: EmploymentAction[] = [
  {
    id: "act-1",
    employeeName: "Sneha Kapoor",
    fadaId: "MH/2024/SK/2101",
    mobile: "+91 98765 10001",
    actionType: "New Join",
    actionDetails: "Joined Andheri West as Sales Consultant",
    branchId: "andheri",
    branchName: "Andheri West",
    designation: "Sales Consultant",
    actionDate: daysAgo(2),
    initiatedBy: "Company Admin",
    status: "Pending",
    documentCount: 2,
    source: "mock",
  },
  {
    id: "act-2",
    employeeName: "Vikram Shah",
    fadaId: "MH/2023/VS/1540",
    mobile: "+91 98200 10002",
    actionType: "New Join",
    actionDetails: "Joined Pune Service as Service Advisor",
    branchId: "pune",
    branchName: "Pune Service",
    designation: "Service Advisor",
    actionDate: daysAgo(5),
    initiatedBy: "HR Coordinator",
    status: "Completed",
    documentCount: 4,
    source: "mock",
  },
  {
    id: "act-3",
    employeeName: "Ananya Iyer",
    fadaId: "MH/2022/AI/0888",
    mobile: "+91 98111 10003",
    actionType: "Transfer",
    actionDetails: "Andheri West → Thane Sales",
    branchId: "thane",
    branchName: "Thane Sales",
    designation: "Team Lead",
    actionDate: daysAgo(8),
    initiatedBy: "Branch Manager",
    status: "Completed",
    documentCount: 1,
    source: "mock",
  },
  {
    id: "act-4",
    employeeName: "Karan Desai",
    fadaId: "MH/2024/KD/3012",
    mobile: "+91 99000 10004",
    actionType: "Exit",
    actionDetails: "Resigned from Andheri West",
    branchId: "andheri",
    branchName: "Andheri West",
    designation: "CRM Executive",
    actionDate: lastMonthDay(15),
    initiatedBy: "Employee",
    status: "Completed",
    documentCount: 0,
    source: "mock",
  },
  {
    id: "act-5",
    employeeName: "Meera Joshi",
    fadaId: "MH/2021/MJ/0440",
    mobile: "+91 97666 10005",
    actionType: "Other",
    actionDetails: "Designation update: Advisor → Senior Advisor",
    branchId: "pune",
    branchName: "Pune Service",
    designation: "Senior Advisor",
    actionDate: daysAgo(3),
    initiatedBy: "Company Admin",
    status: "Approved",
    documentCount: 0,
    source: "mock",
  },
];
