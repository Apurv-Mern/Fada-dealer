import type {
  Employee,
  EmployeeDocument,
  EmployeeDetail,
  EmployeeFilterOptions,
  EmployeeJoiningCandidate,
  EmployeeStats,
  FilterOption,
} from "@/features/employees/types";

export const employeeStats: EmployeeStats = {
  total: 248,
  active: 231,
  newJoins: 18,
  exited: 6,
};

export const branchFilterOptions: FilterOption[] = [
  { label: "Andheri West", value: "andheri" },
  { label: "Pune Service", value: "pune" },
  { label: "Thane Sales", value: "thane" },
  { label: "Nashik", value: "nashik" },
];

export const designationFilterOptions: FilterOption[] = [
  { label: "Sales Consultant", value: "101" },
  { label: "Service Advisor", value: "201" },
  { label: "Team Lead", value: "102" },
  { label: "CRM Executive", value: "301" },
  { label: "Branch Manager", value: "103" },
  { label: "Technician", value: "202" },
  { label: "HR Coordinator", value: "401" },
];

export const employeeFilterOptions: EmployeeFilterOptions = {
  branches: branchFilterOptions,
  designations: designationFilterOptions,
};

export const employees: Employee[] = [
  {
    id: "1",
    name: "Amit Verma",
    email: "amit.verma@dealer.in",
    phone: "+91 98765 43210",
    fadaId: "MH/2024/AV/1042",
    branch: "Andheri West",
    branchId: "andheri",
    designation: "Sales Consultant",
    designationId: "101",
    departmentId: "10",
    status: "Active",
    fadaScore: 880,
    joinedDate: "2024-03-12",
  },
  {
    id: "2",
    name: "Priya Nair",
    email: "priya.nair@dealer.in",
    phone: "+91 98200 11223",
    fadaId: "MH/2023/PN/0891",
    branch: "Pune Service",
    branchId: "pune",
    designation: "Service Advisor",
    designationId: "201",
    departmentId: "20",
    status: "Active",
    fadaScore: 910,
    joinedDate: "2023-08-01",
  },
  {
    id: "3",
    name: "Rohan Mehta",
    email: "rohan.mehta@dealer.in",
    phone: "+91 98111 22334",
    fadaId: "MH/2022/RM/0550",
    branch: "Thane Sales",
    branchId: "thane",
    designation: "Team Lead",
    designationId: "102",
    departmentId: "10",
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
    branchId: "nashik",
    designation: "CRM Executive",
    designationId: "301",
    departmentId: "30",
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
    branchId: "andheri",
    designation: "Branch Manager",
    designationId: "103",
    departmentId: "10",
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
    branchId: "pune",
    designation: "Technician",
    designationId: "202",
    departmentId: "20",
    status: "Inactive",
    fadaScore: 620,
    isActive: false,
  },
  {
    id: "7",
    name: "Arjun Desai",
    email: "arjun.desai@dealer.in",
    phone: "+91 97000 33445",
    fadaId: "MH/2024/AD/1330",
    branch: "Thane Sales",
    branchId: "thane",
    designation: "Sales Consultant",
    designationId: "101",
    departmentId: "10",
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
    branchId: "andheri",
    designation: "HR Coordinator",
    designationId: "401",
    departmentId: "40",
    status: "On Notice",
    fadaScore: 790,
  },
];

const departmentNames: Record<string, string> = {
  "10": "Sales",
  "20": "Service",
  "30": "CRM",
  "40": "HR",
};

export const mockEmployeeDetailExtras: Record<
  string,
  Omit<EmployeeDetail, keyof Employee>
> = {
  "1": {
    dateOfBirth: "1996-01-26",
    gender: "male",
    city: "Mumbai",
    bloodGroup: "B+",
    address: "Andheri West, Mumbai, Maharashtra 400053",
    experienceYears: "4 years",
    qualification: "B.Com",
    isQualificationVerified: true,
    skills: ["Sales", "CRM", "Negotiation"],
    languages: ["English", "Hindi", "Marathi"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isKycCompleted: false,
    dealershipName: "Dots Motor ltd",
    departmentName: "Sales",
    experiences: [
      {
        id: "exp-1a",
        title: "Sales Consultant",
        subtitle: "Andheri West · Mumbai, Maharashtra",
        company: "Dots Motor ltd",
        isCurrent: true,
        startDate: "2024-03-12",
        employmentType: "full-time",
      },
      {
        id: "exp-1b",
        title: "Junior Sales Executive",
        subtitle: "Thane Sales · Thane, Maharashtra",
        company: "Dots Motor ltd",
        startDate: "2022-01-10",
        endDate: "2024-03-11",
        employmentType: "full-time",
        highlights: "Transferred from Thane Sales to Andheri West",
      },
    ],
    certificates: [
      {
        id: "cert-1",
        title: "Automotive Sales Pro",
        meta: "FADA · CERT-1042",
        date: "2025-06-01",
        description: "Completed advanced retail sales program",
      },
    ],
    trainings: [
      {
        id: "train-1",
        title: "CRM Excellence",
        meta: "Company Academy",
        date: "2025-02-12",
        description: "Lead nurturing and follow-up cadences",
      },
    ],
    appreciations: [
      {
        id: "appr-1",
        title: "Top performer – Q1",
        meta: "Dots Motor ltd",
        date: "2025-04-01",
        description: "Exceeded quarterly retail target",
      },
    ],
    promotions: [],
    skillItems: [
      {
        id: "skill-1",
        title: "Sales",
        meta: "tech · Advanced · Internal",
        date: "2024-08-01",
      },
      {
        id: "skill-2",
        title: "CRM",
        meta: "ops · Intermediate",
      },
      {
        id: "skill-3",
        title: "Negotiation",
        meta: "soft",
      },
    ],
    journeys: [
      {
        id: "journey-1",
        title: "Resume",
        meta: "profile-photo.jpg",
        date: "2026-08-25",
        attachmentUrl: "https://example.com/resume.jpg",
      },
      {
        id: "journey-2",
        title: "Company internship photo",
        meta: "Company photo",
        date: "2022-01-28",
        attachmentUrl: "https://example.com/internship.jpg",
      },
    ],
  },
  "2": {
    dateOfBirth: "1992-05-14",
    gender: "female",
    city: "Pune",
    bloodGroup: "O+",
    address: "Baner, Pune, Maharashtra 411045",
    experienceYears: "6 years",
    qualification: "Diploma in Automobile",
    isQualificationVerified: true,
    skills: ["Service Advisory", "Customer Care"],
    languages: ["English", "Hindi"],
    isEmailVerified: true,
    isPhoneVerified: true,
    isKycCompleted: true,
    dealershipName: "Dots Motor ltd",
    departmentName: "Service",
    experiences: [
      {
        id: "exp-2a",
        title: "Service Advisor",
        subtitle: "Pune Service · Pune, Maharashtra",
        company: "Dots Motor ltd",
        isCurrent: true,
        startDate: "2023-08-01",
        employmentType: "full-time",
      },
    ],
    certificates: [],
    trainings: [],
    appreciations: [],
    promotions: [],
    skillItems: [
      {
        id: "skill-2a",
        title: "Service Advisory",
        meta: "service",
      },
      {
        id: "skill-2b",
        title: "Customer Care",
        meta: "soft",
      },
    ],
  },
};

export function getMockEmployeeDetail(id: string): EmployeeDetail | null {
  const base = employees.find((e) => e.id === id);
  if (!base) return null;
  const extras = mockEmployeeDetailExtras[id] ?? {
    gender: "—",
    city: "—",
    isEmailVerified: Boolean(base.email),
    isPhoneVerified: Boolean(base.phone),
    isKycCompleted: false,
    dealershipName: "Dots Motor ltd",
    departmentName: base.departmentId
      ? departmentNames[base.departmentId] ?? "—"
      : "—",
    experiences: [
      {
        id: `exp-${id}-current`,
        title: base.designation,
        subtitle: `${base.branch}`,
        company: "Dots Motor ltd",
        isCurrent: true,
        startDate: base.joinedDate,
        employmentType: "full-time",
      },
    ],
    certificates: [],
    trainings: [],
    appreciations: [],
    promotions: [],
    skillItems: [],
  };
  return { ...base, ...extras };
}

export const mockEmployeeDocuments: EmployeeDocument[] = [
  {
    id: "1",
    name: "Aadhaar Card",
    isMandatory: true,
    isUploaded: true,
    status: "pending",
    frontImageUrl: "#",
  },
  {
    id: "2",
    name: "PAN Card",
    isMandatory: true,
    isUploaded: true,
    status: "approved",
    frontImageUrl: "#",
  },
  {
    id: "3",
    name: "Driving License",
    isMandatory: false,
    isUploaded: false,
  },
];

/** Joining search mocks for invite flow (GET /dealers/employees/joining). */
export const mockEmployeeJoiningCandidates: EmployeeJoiningCandidate[] = [
  {
    id: "6",
    fadaId: "MH/2023/NK/0777",
    name: "Neha Kulkarni",
    email: "neha.k@dealer.in",
    phone: "+91 98330 77889",
  },
  {
    id: "7",
    fadaId: "MH/2023/RK/0888",
    name: "Rahul Kapoor",
    email: "rahul.k@dealer.in",
    phone: "+91 98111 22334",
  },
  {
    id: "1",
    fadaId: "MH/2024/AV/1042",
    name: "Amit Verma",
    email: "amit.verma@dealer.in",
    phone: "+91 98765 43210",
  },
];
