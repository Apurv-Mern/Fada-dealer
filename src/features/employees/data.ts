export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  fadaId: string;
  branch: string;
  designation: string;
  status: "Active" | "On Notice" | "Inactive";
  fadaScore: number;
};

export const employeeStats = {
  total: 248,
  active: 231,
  newJoins: 18,
  exited: 6,
};

export const employees: EmployeeRow[] = [
  {
    id: "1",
    name: "Amit Verma",
    email: "amit.verma@dealer.in",
    phone: "+91 98765 43210",
    fadaId: "MH/2024/AV/1042",
    branch: "Andheri West",
    designation: "Sales Consultant",
    status: "Active",
    fadaScore: 880,
  },
  {
    id: "2",
    name: "Priya Nair",
    email: "priya.nair@dealer.in",
    phone: "+91 98200 11223",
    fadaId: "MH/2023/PN/0891",
    branch: "Pune Service",
    designation: "Service Advisor",
    status: "Active",
    fadaScore: 910,
  },
  {
    id: "3",
    name: "Rohan Mehta",
    email: "rohan.mehta@dealer.in",
    phone: "+91 98111 22334",
    fadaId: "MH/2022/RM/0550",
    branch: "Thane Sales",
    designation: "Team Lead",
    status: "On Notice",
    fadaScore: 760,
  },
  {
    id: "4",
    name: "Sneha Patil",
    email: "sneha.patil@dealer.in",
    phone: "+91 97654 88990",
    fadaId: "MH/2024/SP/1201",
    branch: "Nashik",
    designation: "CRM Executive",
    status: "Active",
    fadaScore: 845,
  },
  {
    id: "5",
    name: "Vikram Joshi",
    email: "vikram.joshi@dealer.in",
    phone: "+91 99001 44556",
    fadaId: "MH/2021/VJ/0312",
    branch: "Andheri West",
    designation: "Branch Manager",
    status: "Active",
    fadaScore: 940,
  },
  {
    id: "6",
    name: "Neha Kulkarni",
    email: "neha.k@dealer.in",
    phone: "+91 98330 77889",
    fadaId: "MH/2023/NK/0777",
    branch: "Pune Service",
    designation: "Technician",
    status: "Inactive",
    fadaScore: 620,
  },
  {
    id: "7",
    name: "Arjun Desai",
    email: "arjun.desai@dealer.in",
    phone: "+91 97000 33445",
    fadaId: "MH/2024/AD/1330",
    branch: "Thane Sales",
    designation: "Sales Consultant",
    status: "Active",
    fadaScore: 800,
  },
  {
    id: "8",
    name: "Kavita Shah",
    email: "kavita.shah@dealer.in",
    phone: "+91 98989 22110",
    fadaId: "MH/2022/KS/0488",
    branch: "Andheri West",
    designation: "HR Coordinator",
    status: "On Notice",
    fadaScore: 790,
  },
];
