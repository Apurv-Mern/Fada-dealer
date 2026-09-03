import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildEmployeeRequestBody,
  buildEmployeeImportResult,
  computeEmployeeDocumentStats,
  createEmployeeTransfer,
  dedupeEmployeeRows,
  dedupeEmployees,
  getEmployee,
  getEmployeeDocuments,
  getEmployees,
  importEmployeesCsv,
  mapApiEmployee,
  mapApiEmployeeDetail,
  mapEmployeeDocument,
  searchEmployeesForJoining,
  unwrapEmployeeProfilePayload,
} from "@/features/employees/api";
import { buildEmployeeImportTemplateCsv } from "@/features/employees/csv-template";
import { apiFetch, isMockMode } from "@/lib/api";
import { ApiError } from "@/lib/api/errors";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    isMockMode: vi.fn(() => true),
    apiFetch: vi.fn(),
  };
});

describe("mapApiEmployee", () => {
  it("reads department and designation from assignment", () => {
    const employee = mapApiEmployee({
      id: 11,
      name: "Rahul Nair",
      email: "rahul@example.com",
      phone: "9876543210",
      fadaId: "MH/2023/RN/0777",
      assignment: {
        outletId: 18,
        departmentId: 5,
        designationId: 12,
        branch: { id: 18, name: "Thane Sales" },
        outlet: { id: 18, name: "Thane Sales" },
        department: { id: 5, name: "Sales" },
        designation: { id: 12, name: "Consultant" },
      },
    });

    expect(employee.branch).toBe("Thane Sales");
    expect(employee.branchId).toBe("18");
    expect(employee.departmentId).toBe("5");
    expect(employee.designationId).toBe("12");
    expect(employee.designation).toBe("Consultant");
  });

  it("maps assignment.id to assignmentId", () => {
    const employee = mapApiEmployee({
      id: 41,
      name: "dev new",
      assignment: {
        id: 36,
        outletId: 6,
        departmentId: 2,
        designationId: 8,
        branch: { id: 6, name: "test-ram" },
        designation: { id: 8, name: "SD5" },
      },
    });
    expect(employee.assignmentId).toBe("36");
  });

  it("uses nested employee.id, not assignment id", () => {
    const employee = mapApiEmployee({
      id: 99,
      employee: {
        id: 41,
        name: "Meera Joshi",
        fadaId: "MH/2021/MJ/0440",
      },
      assignment: {
        id: 99,
        isCurrentlyWorking: false,
        outlet: { id: 3, name: "Thane Sales" },
      },
    });
    expect(employee.id).toBe("41");
    expect(employee.name).toBe("Meera Joshi");
    expect(employee.fadaId).toBe("MH/2021/MJ/0440");
    expect(employee.branch).toBe("Thane Sales");
  });
});

describe("dedupeEmployees", () => {
  it("keeps the first API row for the same employee id", () => {
    const firstRaw = {
      employee: { id: 41, name: "Meera Joshi" },
      assignment: {
        isCurrentlyWorking: false,
        branch: { name: "Andheri West" },
      },
    };
    const laterRaw = {
      employee: { id: 41, name: "Meera Joshi" },
      assignment: {
        isCurrentlyWorking: true,
        branch: { name: "Thane Sales" },
      },
    };
    const first = mapApiEmployee(firstRaw);
    const later = mapApiEmployee(laterRaw);
    const other = mapApiEmployee({
      id: 7,
      name: "Other",
      assignment: { branch: { name: "Pune Service" } },
    });

    const collapsed = dedupeEmployees([first, later, other]);

    expect(collapsed).toHaveLength(2);
    expect(collapsed.map((row) => row.id)).toEqual(["41", "7"]);
    expect(collapsed[0]?.branch).toBe("Andheri West");
  });

  it("maps live list branch and designation from the first assignment row", () => {
    const rows = [
      {
        id: 41,
        name: "dev new",
        assignment: {
          id: 1,
          isCurrentlyWorking: false,
          isActive: true,
          status: "rejected",
          outletId: 1,
          departmentId: 2,
          designationId: 8,
          branch: { id: 1, name: "test101" },
          department: { id: 2, name: "dev" },
          designation: { id: 8, name: "SD5" },
        },
      },
      {
        id: 41,
        name: "dev new",
        assignment: {
          id: 36,
          isCurrentlyWorking: true,
          isActive: true,
          status: "verified",
          outletId: 6,
          departmentId: 2,
          designationId: 8,
          branch: { id: 6, name: "test-ram" },
          department: { id: 2, name: "dev" },
          designation: { id: 8, name: "SD5" },
        },
      },
    ];

    const collapsed = dedupeEmployeeRows(rows).map(mapApiEmployee);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]?.branch).toBe("test101");
    expect(collapsed[0]?.designation).toBe("SD5");
    expect(collapsed[0]?.departmentId).toBe("2");
    expect(collapsed[0]?.assignmentId).toBe("1");
  });
});

describe("buildEmployeeRequestBody", () => {
  it("puts department and designation on assignment", () => {
    expect(
      buildEmployeeRequestBody({
        name: "Rahul Nair",
        outletId: "18",
        departmentId: "5",
        designationId: "12",
      }),
    ).toEqual({
      name: "Rahul Nair",
      email: undefined,
      phone: undefined,
      score: undefined,
      joinedDate: undefined,
      isActive: true,
      assignment: {
        outletId: 18,
        departmentId: 5,
        designationId: 12,
        isActive: true,
      },
    });
  });

  it("includes assignment.id when assignmentId is provided", () => {
    expect(
      buildEmployeeRequestBody({
        name: "dev new",
        outletId: "6",
        departmentId: "13",
        designationId: "16",
        assignmentId: "36",
      }),
    ).toEqual({
      name: "dev new",
      email: undefined,
      phone: undefined,
      score: undefined,
      joinedDate: undefined,
      isActive: true,
      assignment: {
        id: 36,
        outletId: 6,
        departmentId: 13,
        designationId: 16,
        isActive: true,
      },
    });
  });
});

describe("createEmployeeTransfer", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  it("posts the live transfer contract", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await createEmployeeTransfer({
      employeeId: "11",
      fromOutletId: "12",
      outletId: "18",
      departmentId: "5",
      designationId: "12",
    });

    expect(apiFetch).toHaveBeenCalledWith("/dealers/employeement-transfer", {
      method: "POST",
      body: {
        employeeId: 11,
        outletId: 18,
        departmentId: 5,
        designationId: 12,
      },
    });
  });

  it("rejects same from/to outlet", async () => {
    await expect(
      createEmployeeTransfer({
        employeeId: "11",
        fromOutletId: "12",
        outletId: "12",
        departmentId: "5",
        designationId: "12",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});

describe("getEmployees", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  it("collapses duplicate live rows and keeps API unique total", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        employees: [
          {
            employee: { id: 41, name: "Meera Joshi" },
            assignment: {
              isCurrentlyWorking: false,
              branch: { name: "Andheri West" },
            },
          },
          {
            employee: { id: 41, name: "Meera Joshi" },
            assignment: {
              isCurrentlyWorking: true,
              outlet: { name: "Thane Sales" },
            },
          },
        ],
        pagination: { total: 1, limit: 10, offset: 0 },
      },
    });

    const page = await getEmployees({ page: 1, pageSize: 10 });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe("41");
    expect(page.items[0]?.branch).toBe("Andheri West");
    expect(page.total).toBe(1);
  });

  it("does not subtract duplicate rows from API unique employee total", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      data: {
        employees: [
          {
            id: 41,
            name: "dev new",
            assignment: {
              id: 1,
              isCurrentlyWorking: false,
              branch: { name: "test-ram" },
            },
          },
          {
            id: 41,
            name: "dev new",
            assignment: {
              id: 36,
              isCurrentlyWorking: true,
              branch: { name: "test-ram" },
              designation: { name: "SD5" },
            },
          },
          {
            id: 33,
            name: "test-dev",
            assignment: {
              id: 21,
              isCurrentlyWorking: true,
              branch: { name: "test2" },
            },
          },
        ],
        pagination: { total: 9, limit: 100, offset: 0 },
      },
    });

    const page = await getEmployees({ page: 1, pageSize: 100 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(9);
  });
});

describe("mapApiEmployeeDetail", () => {
  it("maps extended profile fields from nested employee", () => {
    const detail = mapApiEmployeeDetail({
      employee: {
        id: 5,
        name: "Sarif Kumar",
        email: "sf28@mailinator.com",
        phone: "+91 9560866000",
        fadaId: "FADA-DR-59586",
        dateOfBirth: "1996-01-26",
        gender: "male",
        city: "Mumbai",
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycCompleted: false,
      },
      assignment: {
        outlet: { id: 2, name: "West dors showroom" },
        department: { id: 10, name: "Sales" },
        designation: { id: 101, name: "Sales Consultant" },
      },
    });

    expect(detail.name).toBe("Sarif Kumar");
    expect(detail.dateOfBirth).toBe("1996-01-26");
    expect(detail.gender).toBe("male");
    expect(detail.city).toBe("Mumbai");
    expect(detail.isEmailVerified).toBe(true);
    expect(detail.isKycCompleted).toBe(false);
    expect(detail.departmentName).toBe("Sales");
    expect(detail.experiences?.[0]?.title).toBe("Sales Consultant");
  });

  it("maps personal and professional optional fields when present", () => {
    const detail = mapApiEmployeeDetail({
      employee: {
        id: 5,
        name: "Sarif Kumar",
        bloodGroup: "B+",
        qualification: "B.Com",
        isQualificationVerified: true,
        experience: "4 years",
        skills: [{ name: "Sales" }, "CRM"],
        languages: ["English", "Hindi"],
        address: {
          addressLine1: "Andheri West",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400053",
        },
      },
      assignment: {
        outlet: { id: 2, name: "West dors showroom" },
        department: { id: 10, name: "Sales" },
        designation: { id: 101, name: "Sales Consultant" },
      },
    });

    expect(detail.bloodGroup).toBe("B+");
    expect(detail.qualification).toBe("B.Com");
    expect(detail.isQualificationVerified).toBe(true);
    expect(detail.experienceYears).toBe("4 years");
    expect(detail.skills).toEqual(["Sales", "CRM"]);
    expect(detail.languages).toEqual(["English", "Hindi"]);
    expect(detail.address).toContain("Andheri West");
    expect(detail.address).toContain("Mumbai");
  });

  it("maps dealer profile object with workExperiences and empty journey arrays", () => {
    const detail = mapApiEmployeeDetail({
      id: 41,
      fadaId: "FADA-CB-46698",
      name: "dev new",
      email: "devmailnew@gmail.com",
      phone: "+91 6201050668",
      dob: null,
      gender: null,
      bloodGroup: null,
      profilePicture: null,
      isActive: true,
      isPhoneVerified: false,
      isEmailVerified: false,
      isKycCompleted: false,
      status: "pending",
      score: 10,
      joinedDate: "2026-08-12",
      addresses: [],
      documents: [],
      appreciations: [],
      certificates: [],
      promotions: [],
      trainings: [],
      skills: [],
      workExperiences: [
        {
          id: 36,
          startDate: "2026-08-14",
          employeementType: "full-time",
          isCurrentlyWorking: true,
          endDate: null,
          highlights: "Transferred from test101 to test-ram",
          dealership: { id: 16, name: "Abhishek dev" },
          branch: {
            id: 6,
            name: "test-ram",
            city: "Jaipur",
            state: "Rajasthan",
          },
          department: { id: 2, name: "dev" },
          designation: { id: 8, name: "SD5" },
        },
        {
          id: 35,
          startDate: "2026-08-14",
          employeementType: "full-time",
          isCurrentlyWorking: false,
          endDate: "2026-08-14",
          highlights: "Transferred from test-ram to test101",
          dealership: { id: 16, name: "Abhishek dev" },
          branch: {
            id: 1,
            name: "test101",
            city: "Wicksburg",
            state: "AL",
          },
          department: { id: 2, name: "dev" },
          designation: { id: 8, name: "SD5" },
        },
      ],
    });

    expect(detail.id).toBe("41");
    expect(detail.fadaId).toBe("FADA-CB-46698");
    expect(detail.fadaScore).toBe(10);
    expect(detail.branch).toBe("test-ram");
    expect(detail.branchId).toBe("6");
    expect(detail.designation).toBe("SD5");
    expect(detail.designationId).toBe("8");
    expect(detail.departmentName).toBe("dev");
    expect(detail.dealershipName).toBe("Abhishek dev");
    expect(detail.dateOfBirth).toBeUndefined();
    expect(detail.address).toBeUndefined();
    expect(detail.experiences).toHaveLength(2);
    expect(detail.experiences?.[0]?.isCurrent).toBe(true);
    expect(detail.experiences?.[0]?.highlights).toContain("test-ram");
    expect(detail.experiences?.[0]?.employmentType).toBe("full-time");
    expect(detail.certificates).toEqual([]);
    expect(detail.trainings).toEqual([]);
    expect(detail.appreciations).toEqual([]);
    expect(detail.promotions).toEqual([]);
    expect(detail.skillItems).toEqual([]);
  });

  it("uses assignment department and designation, not later workExperiences", () => {
    const detail = mapApiEmployeeDetail({
      id: 32,
      name: "Shubham Jain",
      fadaId: "FADA-2026-000017",
      assignment: {
        id: 41,
        outletId: 1,
        departmentId: 10,
        designationId: 4,
        branch: { id: 1, name: "test101" },
        department: { id: 10, name: "Tester" },
        designation: { id: 4, name: "SD" },
      },
      workExperiences: [
        {
          id: 42,
          isCurrentlyWorking: true,
          branch: { id: 1, name: "test101" },
          department: { id: 11, name: "Updated Dept" },
          designation: { id: 9, name: "Updated Role" },
        },
      ],
    });

    expect(detail.branch).toBe("test101");
    expect(detail.departmentId).toBe("10");
    expect(detail.designation).toBe("SD");
    expect(detail.departmentName).toBe("Tester");
    expect(detail.assignmentId).toBe("41");
  });

  it("maps structured skills and journey collections", () => {
    const detail = mapApiEmployeeDetail({
      id: 5,
      name: "shambhu meena",
      fadaId: "FADA-2026-000003",
      skills: [
        {
          id: 1,
          skillName: "Node Js",
          skillCategory: "tech",
          proficiencyLevel: "advanced",
          learningSource: "W3School",
          skillDate: "2026-08-11",
          description: "Backend APIs",
        },
      ],
      certificates: [
        {
          id: 1,
          certificateName: "PHP",
          issuingAuthority: "Dots",
          issueDate: "2026-08-10",
          certificateNumber: "FJIODJFL",
          attachment: "https://example.com/cert.pdf",
        },
      ],
      trainings: [],
      appreciations: [
        {
          id: 1,
          appreciationTitle: "First appreciation",
          issuedBy: "Dotsqueare",
          appreciationDate: "2026-08-10",
          description: "Great work",
        },
      ],
      promotions: [],
      addresses: [
        {
          id: 1,
          addressLine1: "Dotsqueares",
          city: "Jaipur",
          state: "Rajasthan",
          pincode: "302017",
          isActive: true,
        },
      ],
      workExperiences: [],
    });

    expect(detail.skills).toEqual(["Node Js"]);
    expect(detail.skillItems?.[0]?.title).toBe("Node Js");
    expect(detail.skillItems?.[0]?.meta).toContain("tech");
    expect(detail.certificates?.[0]?.title).toBe("PHP");
    expect(detail.certificates?.[0]?.attachmentUrl).toBe(
      "https://example.com/cert.pdf",
    );
    expect(detail.appreciations?.[0]?.title).toBe("First appreciation");
    expect(detail.address).toContain("Dotsqueares");
    expect(detail.city).toBe("Jaipur");
  });

  it("maps journeys array onto photos journey items", () => {
    const detail = mapApiEmployeeDetail({
      id: 53,
      name: "Rehan Kumar",
      fadaId: "FADA-EY-86299",
      certificates: [
        {
          id: 5,
          certificateName: "Ai- Based Test Automation Tool",
          issuingAuthority: "TestRigor",
          issueDate: "2025-01-25",
          certificateNumber: "34Zvvt7ndjd@Qww",
          attachment: "https://api.fadaid.com/uploads/cert.jpeg",
        },
      ],
      skills: [
        {
          id: 5,
          skillName: "Azure Fundamental",
          skillCategory: "Azure devops",
          proficiencyLevel: "Beginner",
          skillDate: "2026-07-17",
        },
      ],
      journeys: [
        {
          id: 7,
          title: "Resume",
          subtitle: "IMG20260710170504.jpg",
          journeyDate: "2026-08-25",
          attachments: [
            "https://api.fadaid.com/uploads/1787665605181-110546855.jpg",
          ],
        },
        {
          id: 6,
          title: "Company internship photo",
          subtitle: "Company photo",
          journeyDate: "2022-01-28",
          attachments: [
            "https://api.fadaid.com/uploads/1787218088645-470678662.jpg",
          ],
        },
      ],
    });

    expect(detail.journeys).toHaveLength(2);
    expect(detail.journeys?.[0]).toEqual({
      id: "7",
      title: "Resume",
      meta: "IMG20260710170504.jpg",
      date: "2026-08-25",
      attachmentUrl:
        "https://api.fadaid.com/uploads/1787665605181-110546855.jpg",
    });
    expect(detail.journeys?.[1]?.title).toBe("Company internship photo");
    expect(detail.journeys?.[1]?.meta).toBe("Company photo");
    expect(detail.journeys?.[1]?.date).toBe("2022-01-28");
    expect(detail.journeys?.[1]?.attachmentUrl).toBe(
      "https://api.fadaid.com/uploads/1787218088645-470678662.jpg",
    );
    expect(detail.certificates?.[0]?.title).toBe(
      "Ai- Based Test Automation Tool",
    );
    expect(detail.skillItems?.[0]?.title).toBe("Azure Fundamental");
  });
});

describe("unwrapEmployeeProfilePayload", () => {
  it("returns object data as-is", () => {
    const payload = unwrapEmployeeProfilePayload({
      success: true,
      data: { id: 41, name: "dev new" },
    });
    expect(payload).toEqual({ id: 41, name: "dev new" });
  });

  it("takes first item when data is an array", () => {
    const payload = unwrapEmployeeProfilePayload({
      success: true,
      data: [{ id: 5, name: "A" }, { id: 6, name: "B" }],
    });
    expect(payload).toEqual({ id: 5, name: "A" });
  });

  it("throws when data array is empty", () => {
    expect(() =>
      unwrapEmployeeProfilePayload({ success: true, data: [] }),
    ).toThrow(ApiError);
  });
});

describe("mapEmployeeDocument", () => {
  it("maps uploaded document checklist rows", () => {
    const doc = mapEmployeeDocument({
      id: 2,
      name: "PAN Card",
      isMandatory: true,
      isUploaded: true,
      upload: { status: "approved", frontImage: "https://example.com/pan.jpg" },
    });

    expect(doc.id).toBe("2");
    expect(doc.name).toBe("PAN Card");
    expect(doc.isMandatory).toBe(true);
    expect(doc.isUploaded).toBe(true);
    expect(doc.status).toBe("approved");
    expect(doc.frontImageUrl).toBe("https://example.com/pan.jpg");
  });
});

describe("computeEmployeeDocumentStats", () => {
  it("counts uploaded and mandatory approved documents", () => {
    const stats = computeEmployeeDocumentStats([
      {
        id: "1",
        name: "Aadhaar",
        isMandatory: true,
        isUploaded: true,
        status: "pending",
      },
      {
        id: "2",
        name: "PAN",
        isMandatory: true,
        isUploaded: true,
        status: "approved",
      },
      {
        id: "3",
        name: "License",
        isMandatory: false,
        isUploaded: false,
      },
    ]);

    expect(stats).toEqual({
      uploaded: 2,
      total: 3,
      mandatoryUploaded: 2,
      mandatoryTotal: 2,
      mandatoryApproved: 1,
    });
  });
});

describe("getEmployee", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  it("returns mock detail for known employee id", async () => {
    const detail = await getEmployee("1");
    expect(detail.id).toBe("1");
    expect(detail.name).toBe("Amit Verma");
    expect(detail.experiences?.length).toBeGreaterThan(0);
  });

  it("throws for unknown mock employee id", async () => {
    await expect(getEmployee("missing")).rejects.toBeInstanceOf(ApiError);
  });

  it("calls dealers employees profile endpoint when mocks are off", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: {
        id: 41,
        name: "dev new",
        fadaId: "FADA-CB-46698",
        isActive: true,
        score: 10,
        workExperiences: [],
        addresses: [],
        skills: [],
        certificates: [],
        trainings: [],
        appreciations: [],
        promotions: [],
      },
    });

    const detail = await getEmployee("41");

    expect(apiFetch).toHaveBeenCalledWith("/dealers/employees/profile/41");
    expect(detail.id).toBe("41");
    expect(detail.name).toBe("dev new");
  });
});

describe("getEmployeeDocuments", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
  });

  it("returns mock document checklist", async () => {
    const docs = await getEmployeeDocuments("1");
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]?.name).toBeTruthy();
  });
});

describe("searchEmployeesForJoining", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  const liveEmployee = {
    id: 47,
    fadaId: "FADA-DR-59586",
    name: "sarit kumar",
    email: "xf7@mailinator.com",
    phone: "+91 9568866088",
    isProfilePrivate: false,
  };

  it("maps a live single-object payload", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      message: "Employee profile fetched successfully",
      data: liveEmployee,
    });

    const rows = await searchEmployeesForJoining("FADA-DR-59586");

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employees/joining?search=FADA-DR-59586",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: "47",
      fadaId: "FADA-DR-59586",
      name: "sarit kumar",
      email: "xf7@mailinator.com",
      phone: "+91 9568866088",
    });
  });

  it("maps a swagger array payload", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: [liveEmployee],
    });

    const rows = await searchEmployeesForJoining("FADA-DR-59586");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("47");
    expect(rows[0]?.fadaId).toBe("FADA-DR-59586");
  });

  it("throws when data is an empty array", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: [] });

    await expect(
      searchEmployeesForJoining("FADA-DR-59586"),
    ).rejects.toMatchObject({
      message: "No employee found for that FADA ID",
      status: 404,
    });
  });

  it("throws when data is null", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: null });

    await expect(
      searchEmployeesForJoining("FADA-DR-59586"),
    ).rejects.toMatchObject({
      message: "No employee found for that FADA ID",
      status: 404,
    });
  });
});

describe("buildEmployeeImportResult", () => {
  const items = [
    {
      name: "John Doe",
      email: "john@example.com",
      phone: "9876543210",
      designation: "Sales Executive",
      department: "Sales",
      outletCode: "OT583721",
      startDate: "2026-01-15",
    },
    {
      name: "Jane Skip",
      email: "skip@example.com",
      phone: "9876543211",
      designation: "Advisor",
      department: "Service",
      outletCode: "OT583722",
      startDate: "2026-01-16",
    },
  ];

  it("derives counts from skipped rows", () => {
    const result = buildEmployeeImportResult(items, [
      {
        ...items[1]!,
        reason: "Employee already working presently.",
      },
    ]);

    expect(result).toEqual({
      total: 2,
      created: 1,
      failed: 1,
      errors: [
        {
          row: 3,
          message: "Employee already working presently.",
        },
      ],
    });
  });

  it("returns parse errors without calling API semantics", () => {
    const result = buildEmployeeImportResult(
      [],
      [],
      [{ row: 2, message: "Invalid email address" }],
    );

    expect(result).toEqual({
      total: 1,
      created: 0,
      failed: 1,
      errors: [{ row: 2, message: "Invalid email address" }],
    });
  });
});

describe("importEmployeesCsv", () => {
  afterEach(() => {
    vi.mocked(isMockMode).mockReturnValue(true);
    vi.mocked(apiFetch).mockReset();
  });

  function importFile(content: string): Promise<import("@/features/employees/types").EmployeeImportResult> {
    const file = new File([content], "import.csv", { type: "text/csv" });
    return importEmployeesCsv(file);
  }

  it("posts JSON array in live mode", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true, data: [] });

    await importFile(buildEmployeeImportTemplateCsv());

    expect(apiFetch).toHaveBeenCalledWith("/dealers/employees/import", {
      method: "POST",
      body: [
        {
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          designation: "Sales Executive",
          department: "Sales",
          outletCode: "OT583721",
          startDate: "2026-01-15",
        },
      ],
    });
  });

  it("maps live skipped rows into UI result", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({
      success: true,
      data: [
        {
          name: "John Doe",
          email: "john@example.com",
          phone: "9876543210",
          designation: "Sales Executive",
          department: "Sales",
          outletCode: "OT583721",
          startDate: "2026-01-15",
          reason: "Outlet not found",
        },
      ],
    });

    const result = await importFile(buildEmployeeImportTemplateCsv());

    expect(result).toEqual({
      total: 1,
      created: 0,
      failed: 1,
      errors: [{ row: 2, message: "Outlet not found" }],
    });
  });

  it("mock mode skips rows whose email contains skip", async () => {
    const csv = `${[
      "name",
      "email",
      "phone",
      "designation",
      "department",
      "outletCode",
      "startDate",
    ].join(",")}\nJohn,john@example.com,9876543210,Exec,Sales,OT583721,2026-01-15\nJane,skip@example.com,9876543211,Advisor,Service,OT583722,2026-01-16`;

    const result = await importFile(csv);

    expect(result.total).toBe(2);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.message).toBe(
      "Employee already working presently.",
    );
  });

  it("returns parse errors without posting", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);

    const result = await importFile("name,email\nJane,not-an-email");

    expect(apiFetch).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.failed).toBeGreaterThan(0);
  });
});
