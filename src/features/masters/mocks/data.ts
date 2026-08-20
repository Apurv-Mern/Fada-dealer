import type { MasterIdNameItem } from "@/features/masters/types";

export const mockDepartments: MasterIdNameItem[] = [
  { id: "10", name: "Sales" },
  { id: "20", name: "Service" },
  { id: "30", name: "CRM" },
  { id: "40", name: "HR" },
];

/** Designations keyed by parent department id. */
export const mockDesignationsByDepartment: Record<string, MasterIdNameItem[]> = {
  "10": [
    { id: "101", name: "Sales Consultant" },
    { id: "102", name: "Team Lead" },
    { id: "103", name: "Branch Manager" },
  ],
  "20": [
    { id: "201", name: "Service Advisor" },
    { id: "202", name: "Technician" },
  ],
  "30": [{ id: "301", name: "CRM Executive" }],
  "40": [{ id: "401", name: "HR Coordinator" }],
};

export const mockBrands: MasterIdNameItem[] = [
  { id: "1", name: "Honda" },
  { id: "2", name: "Maruti Suzuki" },
  { id: "3", name: "Toyota" },
  { id: "4", name: "Hyundai" },
  { id: "5", name: "Tata Motors" },
  { id: "6", name: "Mahindra" },
  { id: "7", name: "Audi" },
  { id: "8", name: "BMW" },
  { id: "9", name: "MG" },
  { id: "10", name: "Tata" },
];

export const mockOutletFunctions: MasterIdNameItem[] = [
  { id: "1", name: "Sales" },
  { id: "2", name: "Workshop" },
  { id: "3", name: "Service" },
  { id: "4", name: "Sales, Service, & Spares" },
];
