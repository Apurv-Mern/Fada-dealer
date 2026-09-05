import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getEmploymentActionsPage,
  mapLeavingToAction,
} from "@/features/employment-actions/api";
import {
  advanceInvitationStatus,
  advanceLeavingStatus,
  clearEmploymentRequestsListCache,
  collectCompletedJoinSteps,
  collectCompletedLeavingSteps,
  getEmploymentRequestsPage,
  getInvitationDetail,
  getInvitationSteps,
  getLeavingDetail,
  getLeavingSteps,
  mapApiInvitation,
  mapApiLeaving,
  mapInvitationDetail,
  mapInvitationSteps,
  mapLeavingDetail,
  mapLeavingSteps,
  formatPopupDateTime,
  resolveSendInvitationActor,
  unwrapDetailRecord,
  updateInvitationStatus,
  updateLeavingStatus,
  updateRequestStatus,
} from "@/features/employment-requests/api";
import {
  isDealerActor,
  isEmployeeOwnedJoinStep,
  nextDealerJoinStatus,
  nextJoinInvitationStatus,
} from "@/features/employment-requests/joining-steps";
import { nextLeavingExitStatus } from "@/features/employment-requests/leaving-steps";
import {
  mockEmploymentRequests,
  resetMockEmploymentRequests,
} from "@/features/employment-requests/mocks/data";
import { computeTypeCounts } from "@/features/employment-requests/types";
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

function resetEmploymentRequestsApiState() {
  resetMockEmploymentRequests();
  clearEmploymentRequestsListCache();
  vi.mocked(isMockMode).mockReturnValue(true);
  vi.mocked(apiFetch).mockReset();
}

function mockLiveEmploymentRequestsFetch() {
  vi.mocked(apiFetch).mockImplementation(async (path: string) => {
    if (String(path).includes("/dealers/employer-invitations")) {
      return {
        data: [{ id: 1, status: "pending", employee: { name: "Join Emp" } }],
      };
    }
    if (String(path).includes("/dealers/employer-leaving")) {
      return {
        data: [{ id: 2, status: "pending", employee: { name: "Exit Emp" } }],
      };
    }
    if (String(path).includes("/dealers/outlets")) {
      return { data: [] };
    }
    throw new ApiError({ message: `Unexpected ${path}`, status: 500 });
  });
}

function listFetchPaths(): string[] {
  return vi
    .mocked(apiFetch)
    .mock.calls.map(([path]) => String(path))
    .filter(
      (path) =>
        path.includes("/dealers/employer-invitations") ||
        path.includes("/dealers/employer-leaving"),
    );
}

describe("mapApiLeaving", () => {
  it("maps nested leaving payload to an Exit request", () => {
    const row = mapApiLeaving({
      id: 42,
      status: "pending",
      createdAt: "2026-03-27T10:00:00.000Z",
      employee: { name: "Meera Joshi", fadaId: "MH/2021/MJ/0440" },
      outlet: { id: 9, name: "Pune Service" },
    });

    expect(row.id).toBe("42");
    expect(row.requestType).toBe("Exit");
    expect(row.canDecide).toBe(true);
    expect(row.canAdvanceWorkflow).toBe(true);
    expect(row.employeeName).toBe("Meera Joshi");
    expect(row.fadaId).toBe("MH/2021/MJ/0440");
    expect(row.branchName).toBe("Pune Service");
    expect(row.branchId).toBe("9");
    expect(row.requestedAt).toBe("2026-03-27");
  });

  it("maps accepted leaving to Accepted with workflow actions", () => {
    const row = mapApiLeaving({ id: 1, status: "accepted" });
    expect(row.status).toBe("Accepted");
    expect(row.canDecide).toBe(false);
    expect(row.canAdvanceWorkflow).toBe(true);
    expect(row.requestType).toBe("Exit");
  });

  it("maps accepted leaving with exit_completed to Approved", () => {
    const row = mapApiLeaving({
      id: 1,
      status: "accepted",
      statuses: [
        { status: "inform_employer" },
        { status: "accept_resignation" },
        { status: "handover_completed" },
        { status: "clearance_completed" },
        { status: "exit_completed" },
      ],
    });
    expect(row.status).toBe("Approved");
    expect(row.canAdvanceWorkflow).toBe(false);
  });
});

describe("nextLeavingExitStatus", () => {
  it("returns inform_employer when statuses is empty", () => {
    expect(nextLeavingExitStatus([])).toBe("inform_employer");
  });
});

describe("collectCompletedLeavingSteps", () => {
  it("normalizes history slugs and fills earlier workflow steps", () => {
    expect(
      collectCompletedLeavingSteps({
        status: "accepted",
        history: [{ status: "clearance_completed" }],
      }),
    ).toEqual(
      expect.arrayContaining(["handover_completed", "clearance_completed"]),
    );
  });

  it("includes early workflow statuses from statuses array", () => {
    expect(
      collectCompletedLeavingSteps({
        status: "accepted",
        statuses: [
          { status: "inform_employer" },
          { status: "accept_resignation" },
          { status: "handover_completed" },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        "inform_employer",
        "accept_resignation",
        "handover_completed",
      ]),
    );
  });
});

describe("formatPopupDateTime", () => {
  it("formats date-only values without time", () => {
    const formatted = formatPopupDateTime("2026-09-05");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/Sep|Sept/);
    expect(formatted).not.toMatch(/:\d{2}/);
  });

  it("formats timestamps with time like Requested", () => {
    const formatted = formatPopupDateTime("2026-09-05T07:25:05.000Z");
    expect(formatted).toMatch(/2026/);
    expect(formatted).toMatch(/:\d{2}/);
  });
});

describe("mapLeavingDetail", () => {
  it("includes resignation fields and history", () => {
    const row = mapLeavingDetail({
      id: 8,
      status: "handover_completed",
      resignationDate: "2026-03-12",
      lastWorkingDay: "2026-03-31",
      reason: "Relocation",
      employee: { name: "Rahul Nair", fadaId: "MH/2023/RN/0777" },
      history: [
        { id: 1, status: "accept_resignation", createdAt: "2026-03-13T10:00:00.000Z" },
        { id: 2, status: "handover_completed", createdAt: "2026-03-18T11:00:00.000Z" },
      ],
    });
    expect(row.resignationDate).toBe("2026-03-12");
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/31/);
    expect(row.reason).toBe("Relocation");
    expect(row.completedSteps).toEqual(
      expect.arrayContaining(["accept_resignation", "handover_completed"]),
    );
    expect(row.history).toHaveLength(2);
    expect(row.canAdvanceWorkflow).toBe(true);
  });

  it("maps lastWorkingDate alias onto lastWorkingDay", () => {
    const row = mapLeavingDetail({
      id: 9,
      status: "pending",
      lastWorkingDate: "2026-04-15",
    });
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/15/);
  });

  it("maps snake_case last_working_date onto lastWorkingDay", () => {
    const row = mapLeavingDetail({
      id: 10,
      status: "pending",
      last_working_date: "2026-04-20",
    });
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/20/);
  });

  it("falls back to assignment.endDate when last working fields are empty", () => {
    const row = mapLeavingDetail({
      id: 12,
      status: "pending",
      lastWorkingDate: null,
      assignment: { endDate: "2026-05-20" },
    });
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/20/);
    expect(row.lastWorkingDay).not.toMatch(/:\d{2}/);
  });

  it("prefers lastWorkingDate over assignment.endDate", () => {
    const row = mapLeavingDetail({
      id: 13,
      status: "pending",
      lastWorkingDate: "2026-04-15",
      assignment: { endDate: "2026-05-20" },
    });
    expect(row.lastWorkingDay).toMatch(/15/);
    expect(row.lastWorkingDay).not.toMatch(/20 May|May 20/);
  });

  it("falls back to assignment.endDate when lastWorkingDate is empty", () => {
    const row = mapLeavingDetail({
      id: 14,
      status: "pending",
      lastWorkingDate: "",
      assignment: { endDate: "2026-06-01" },
    });
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/1/);
  });

  it("formats assignment.endDate for live leaving payload without time", () => {
    const row = mapLeavingDetail({
      id: 2,
      status: "rejected",
      lastWorkingDate: null,
      createdAt: "2026-09-05T07:25:05.000Z",
      assignment: { endDate: "2026-09-05" },
    });
    expect(row.lastWorkingDay).toMatch(/Sep|Sept/);
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).not.toMatch(/:\d{2}/);
    expect(row.requestedAtDateTime).toMatch(/:\d{2}/);
  });

  it("falls back to resignationDate when last working fields are absent", () => {
    const row = mapLeavingDetail({
      id: 11,
      status: "pending",
      resignationDate: "2026-03-12",
    });
    expect(row.resignationDate).toBe("2026-03-12");
    expect(row.lastWorkingDay).toMatch(/2026/);
    expect(row.lastWorkingDay).toMatch(/12/);
  });

  it("maps live leaving payload with assignment department and designation", () => {
    const row = mapLeavingDetail({
      id: 1,
      employeeAssignmentId: 40,
      employeeId: 30,
      dealerId: 16,
      outletId: 1,
      reason: "Hey i am leaving this",
      initiatedBy: "employee",
      status: "accepted",
      createdAt: "2026-08-19T07:30:02.000Z",
      employee: {
        id: 30,
        fadaId: "FADA-2026-000015",
        name: "Apurv Gupta",
        phone: "+91 9057618569",
      },
      branch: { id: 1, name: "test101" },
      assignment: {
        department: { id: 2, name: "dev" },
        designation: { id: 5, name: "SD2" },
      },
      statuses: [
        {
          id: 1,
          status: "inform_employer",
          actionUserBy: "employee",
          createdAt: "2026-08-19T07:30:02.000Z",
        },
        {
          id: 2,
          status: "accept_resignation",
          actionUserBy: "dealer",
          createdAt: "2026-08-19T07:30:36.000Z",
        },
      ],
    });

    expect(row.fadaId).toBe("FADA-2026-000015");
    expect(row.branchName).toBe("test101");
    expect(row.departmentName).toBe("dev");
    expect(row.designationName).toBe("SD2");
    expect(row.reason).toBe("Hey i am leaving this");
    expect(row.requestedAtDateTime).toMatch(/2026/);
    expect(row.acceptedAt).toMatch(/2026/);
  });
});

describe("mapLeavingSteps", () => {
  it("maps step payloads and falls back when empty", () => {
    const steps = mapLeavingSteps({
      data: [
        { id: 1, status: "handover_completed", title: "Handover", description: "Done" },
      ],
    });
    expect(steps[0]?.status).toBe("handover_completed");
    expect(mapLeavingSteps({ data: [] }).length).toBe(6);
  });
});

describe("mapApiInvitation", () => {
  it("still maps as Join", () => {
    const row = mapApiInvitation({ id: 7, status: "pending" });
    expect(row.requestType).toBe("Join");
    expect(row.canDecide).toBe(true);
  });

  it("maps in-review invitation with completed steps", () => {
    const row = mapApiInvitation({
      id: 2,
      status: "accepted",
      employee: {
        name: "Vikram Shah",
        fadaId: "MH/2023/VS/1540",
        phone: "+91 91234 56789",
      },
      outlet: { id: "pune", name: "Pune Service" },
      department: { name: "Service" },
      designation: { name: "Service Advisor" },
      statuses: [
        { status: "send_invitation" },
        { status: "accept_invitation" },
        { status: "share_details" },
      ],
    });
    expect(row.status).toBe("In Review");
    expect(row.canAdvanceWorkflow).toBe(true);
    expect(row.completedSteps).toEqual(
      expect.arrayContaining([
        "send_invitation",
        "accept_invitation",
        "share_details",
      ]),
    );
    expect(row.departmentName).toBe("Service");
    expect(row.designationName).toBe("Service Advisor");
    expect(row.mobile).toBe("+91 91234 56789");
  });

  it("maps joining_confirmed to Approved", () => {
    const row = mapApiInvitation({
      id: 3,
      status: "verified",
      statuses: [{ status: "joining_confirmed" }],
    });
    expect(row.status).toBe("Approved");
    expect(row.canAdvanceWorkflow).toBe(false);
  });
});

describe("nextJoinInvitationStatus", () => {
  it("returns send_invitation when statuses is empty", () => {
    expect(nextJoinInvitationStatus([])).toBe("send_invitation");
  });
});

describe("nextDealerJoinStatus", () => {
  it("blocks on accept_invitation when dealer sent the invitation", () => {
    expect(
      nextDealerJoinStatus(["send_invitation"], true),
    ).toBeNull();
    expect(isEmployeeOwnedJoinStep("accept_invitation", true)).toBe(true);
  });

  it("allows accept_invitation when employee sent the invitation", () => {
    expect(
      nextDealerJoinStatus(["send_invitation"], false),
    ).toBe("accept_invitation");
    expect(isEmployeeOwnedJoinStep("accept_invitation", false)).toBe(false);
  });

  it("always blocks share_details for dealer", () => {
    expect(
      nextDealerJoinStatus(
        ["send_invitation", "accept_invitation"],
        false,
      ),
    ).toBeNull();
    expect(isEmployeeOwnedJoinStep("share_details", false)).toBe(true);
  });

  it("returns employer_verification after share_details", () => {
    expect(
      nextDealerJoinStatus(
        ["send_invitation", "accept_invitation", "share_details"],
        true,
      ),
    ).toBe("employer_verification");
  });

  it("isDealerActor only matches dealer", () => {
    expect(isDealerActor("dealer")).toBe(true);
    expect(isDealerActor("employee")).toBe(false);
    expect(isDealerActor(undefined)).toBe(false);
  });
});

describe("collectCompletedJoinSteps", () => {
  it("normalizes history slugs and fills earlier workflow steps", () => {
    expect(
      collectCompletedJoinSteps({
        status: "accepted",
        history: [{ status: "employer_verification" }],
      }),
    ).toEqual(
      expect.arrayContaining([
        "send_invitation",
        "accept_invitation",
        "share_details",
        "employer_verification",
      ]),
    );
  });
});

describe("mapInvitationDetail", () => {
  it("includes join fields and history", () => {
    const row = mapInvitationDetail({
      id: 8,
      status: "accept_invitation",
      employee: { name: "Vikram Shah", fadaId: "MH/2023/VS/1540" },
      department: { name: "Service" },
      designation: { name: "Service Advisor" },
      history: [
        {
          id: 1,
          status: "send_invitation",
          actionUserBy: "dealer",
          actionUserName: "Pune Motors",
          createdAt: "2026-03-25T09:00:00.000Z",
        },
        {
          id: 2,
          status: "accept_invitation",
          actionUserBy: "employee",
          createdAt: "2026-03-25T11:00:00.000Z",
        },
      ],
    });
    expect(row.departmentName).toBe("Service");
    expect(row.designationName).toBe("Service Advisor");
    expect(row.completedSteps).toEqual(
      expect.arrayContaining(["send_invitation", "accept_invitation"]),
    );
    expect(row.completedSteps).not.toContain("share_details");
    expect(row.history).toHaveLength(2);
    expect(row.history[0]?.actionUserBy).toBe("dealer");
    expect(row.history[0]?.actionUserName).toBe("Pune Motors");
    expect(row.sendInvitationByDealer).toBe(true);
    expect(row.sendInvitationActorName).toBe("Pune Motors");
    // Blocked on employee share_details
    expect(row.canAdvanceWorkflow).toBe(false);
  });

  it("allows dealer accept when invitation was employee-sent", () => {
    const row = mapInvitationDetail({
      id: 9,
      status: "send_invitation",
      employee: { name: "Apurv Gupta" },
      history: [
        {
          id: 1,
          status: "send_invitation",
          actionUserBy: "employee",
          actionUserName: "Apurv Gupta",
        },
      ],
    });
    expect(row.sendInvitationByDealer).toBe(false);
    expect(row.canAdvanceWorkflow).toBe(true);
  });

  it("maps live dealer-sent invitation with dealership actor and timestamps", () => {
    const row = mapInvitationDetail({
      id: 49,
      employeeId: 30,
      dealerId: 16,
      outletId: 1,
      invitationSendBy: "dealer",
      status: "rejected",
      createdAt: "2026-08-19T09:15:48.000Z",
      employee: {
        id: 30,
        fadaId: "FADA-2026-000015",
        name: "Apurv Gupta",
        email: "apurv@hotmail.com",
        phone: "+91 9057618569",
      },
      dealership: { id: 16, name: "Abhishek dev", dealerCode: "98769875" },
      branch: { id: 1, name: "test101" },
      department: { id: 2, name: "dev" },
      designation: { id: 7, name: "SD4" },
      statuses: [
        {
          id: 23,
          status: "send_invitation",
          actionUserBy: "dealer",
          createdAt: "2026-08-20T06:18:23.000Z",
        },
        {
          id: 47,
          status: "accept_invitation",
          actionUserBy: "dealer",
          createdAt: "2026-08-25T13:20:22.000Z",
        },
        {
          id: 56,
          status: "reject_invitation",
          actionUserBy: "dealer",
          createdAt: "2026-08-26T05:43:11.000Z",
        },
      ],
    });

    expect(row.fadaId).toBe("FADA-2026-000015");
    expect(row.branchName).toBe("test101");
    expect(row.departmentName).toBe("dev");
    expect(row.designationName).toBe("SD4");
    expect(row.status).toBe("Rejected");
    expect(row.sendInvitationByDealer).toBe(true);
    expect(row.sendInvitationActorName).toBe("Abhishek dev");
    expect(row.requestedAt).toBe("2026-08-19");
    expect(row.requestedAtDateTime).toMatch(/2026/);
    expect(row.rejectedAt).toMatch(/2026/);
    expect(row.acceptedAt).toMatch(/2026/);
  });

  it("prefers invitationSendBy over statuses actionUserBy for actor side", () => {
    const { byDealer, actorName } = resolveSendInvitationActor(
      {
        invitationSendBy: "dealer",
        employee: { name: "Apurv Gupta" },
        dealership: { name: "Abhishek dev" },
      },
      [
        {
          id: "1",
          status: "send_invitation",
          actionUserBy: "dealer",
        },
      ],
      "Apurv Gupta",
    );
    expect(byDealer).toBe(true);
    expect(actorName).toBe("Abhishek dev");
  });
});

describe("mapInvitationSteps", () => {
  it("maps step payloads and falls back when empty", () => {
    const steps = mapInvitationSteps({
      data: [
        {
          id: 1,
          status: "employer_verification",
          title: "Employer Verification",
          description: "Verify documents",
        },
      ],
    });
    expect(steps[0]?.status).toBe("employer_verification");
    expect(mapInvitationSteps({ data: [] }).length).toBe(5);
  });
});

describe("mapLeavingToAction", () => {
  it("maps leaving payload to Exit action", () => {
    const row = mapLeavingToAction({
      id: 12,
      status: "pending",
      employee: { name: "Rahul Nair", fadaId: "MH/2023/RN/0777", phone: "9876543210" },
      outlet: { id: 3, name: "Thane Sales" },
    });

    expect(row.actionType).toBe("Exit");
    expect(row.source).toBe("leaving");
    expect(row.employeeName).toBe("Rahul Nair");
    expect(row.actionDetails).toBe("Exit request from Thane Sales");
  });
});

describe("mock employment requests", () => {
  it("includes Join and Exit rows only", () => {
    const counts = computeTypeCounts(mockEmploymentRequests);
    expect(counts.join).toBe(4);
    expect(counts.exit).toBe(4);
    expect(mockEmploymentRequests.some((r) => r.id === "leave-1" && r.canDecide)).toBe(
      true,
    );
    expect(
      mockEmploymentRequests.some(
        (r) => r.id === "leave-2" && r.canAdvanceWorkflow,
      ),
    ).toBe(true);
    expect(
      mockEmploymentRequests.some(
        (r) => r.id === "inv-2" && r.status === "In Review",
      ),
    ).toBe(true);
  });
});

describe("join workflow order", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("loads mock invitation detail with history and completed steps", async () => {
    const detail = await getInvitationDetail("inv-2");
    expect(detail.requestType).toBe("Join");
    expect(detail.completedSteps).toEqual(
      expect.arrayContaining([
        "send_invitation",
        "accept_invitation",
        "share_details",
      ]),
    );
    expect(detail.history.length).toBeGreaterThan(0);
    expect(nextJoinInvitationStatus(detail.completedSteps)).toBe(
      "employer_verification",
    );
  });

  it("advances join steps in order", async () => {
    const inProgress = await getInvitationDetail("inv-2");
    expect(inProgress.sendInvitationByDealer).toBe(true);
    await advanceInvitationStatus(inProgress, "employer_verification");
    const afterVerification = await getInvitationDetail("inv-2");
    expect(afterVerification.completedSteps).toEqual(
      expect.arrayContaining(["employer_verification"]),
    );
    await expect(
      advanceInvitationStatus(afterVerification, "share_details"),
    ).rejects.toThrow("already completed");
    await expect(
      advanceInvitationStatus(afterVerification, "joining_confirmed"),
    ).rejects.toThrow("Select a joining date");
    await advanceInvitationStatus(
      afterVerification,
      "joining_confirmed",
      "2026-04-01",
    );
    const done = await getInvitationDetail("inv-2");
    expect(done.completedSteps).toContain("joining_confirmed");
    expect(done.canAdvanceWorkflow).toBe(false);
    expect(done.status).toBe("Approved");
  });

  it("loads mock invitation steps", async () => {
    const steps = await getInvitationSteps();
    expect(steps.map((s) => s.status)).toEqual([
      "send_invitation",
      "accept_invitation",
      "share_details",
      "employer_verification",
      "joining_confirmed",
    ]);
  });
});

describe("live join advance routing", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("uses PUT for join workflow steps", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await advanceInvitationStatus(
      {
        id: "9",
        employeeName: "Test",
        fadaId: "—",
        requestType: "Join",
        fromTo: "Branch",
        branchId: "1",
        branchName: "Branch",
        requestedAt: "2026-08-19",
        status: "In Review",
        canDecide: false,
        canAdvanceWorkflow: true,
        completedSteps: [
          "send_invitation",
          "accept_invitation",
          "share_details",
        ],
        history: [],
        sendInvitationByDealer: true,
      },
      "employer_verification",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employer-invitations/9/status/employer_verification",
      { method: "PUT" },
    );
  });

  it("sends joiningDate in PUT body for joining_confirmed", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await advanceInvitationStatus(
      {
        id: "9",
        employeeName: "Test",
        fadaId: "—",
        requestType: "Join",
        fromTo: "Branch",
        branchId: "1",
        branchName: "Branch",
        requestedAt: "2026-08-19",
        status: "In Review",
        canDecide: false,
        canAdvanceWorkflow: true,
        completedSteps: [
          "send_invitation",
          "accept_invitation",
          "share_details",
          "employer_verification",
        ],
        history: [],
        sendInvitationByDealer: true,
      },
      "joining_confirmed",
      "2026-08-25",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employer-invitations/9/status/joining_confirmed",
      { method: "PUT", body: { joiningDate: "2026-08-25" } },
    );
  });
});

describe("leaving workflow order", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("advances early steps on pending exit requests", async () => {
    const pending = mockEmploymentRequests.find((r) => r.id === "leave-1");
    expect(pending).toBeTruthy();
    expect(nextLeavingExitStatus(pending?.completedSteps)).toBe("inform_employer");

    await advanceLeavingStatus(pending!, "inform_employer");
    const afterInform = await getLeavingDetail("leave-1");
    expect(afterInform.completedSteps).toContain("inform_employer");
    expect(nextLeavingExitStatus(afterInform.completedSteps)).toBe(
      "submit_resignation",
    );
  });

  it("accept_resignation on pending uses accept path and sets Accepted", async () => {
    const pending = await getLeavingDetail("leave-1");
    await advanceLeavingStatus(pending, "inform_employer");
    await advanceLeavingStatus(
      await getLeavingDetail("leave-1"),
      "submit_resignation",
    );
    await advanceLeavingStatus(
      await getLeavingDetail("leave-1"),
      "accept_resignation",
    );
    const accepted = await getLeavingDetail("leave-1");
    expect(accepted.status).toBe("Accepted");
    expect(accepted.completedSteps).toContain("accept_resignation");
  });

  it("advances handover → clearance → exit in order", async () => {
    const inProgress = mockEmploymentRequests.find((r) => r.id === "leave-2");
    expect(inProgress).toBeTruthy();
    expect(nextLeavingExitStatus(inProgress?.completedSteps)).toBe(
      "clearance_completed",
    );
    await advanceLeavingStatus(inProgress!, "clearance_completed");
    const afterClearance = await getLeavingDetail("leave-2");
    expect(afterClearance.completedSteps).toEqual(
      expect.arrayContaining([
        "inform_employer",
        "submit_resignation",
        "accept_resignation",
        "handover_completed",
        "clearance_completed",
      ]),
    );
    await expect(
      advanceLeavingStatus(afterClearance, "handover_completed"),
    ).rejects.toThrow("already completed");
    await advanceLeavingStatus(afterClearance, "exit_completed");
    const done = await getLeavingDetail("leave-2");
    expect(done.completedSteps).toContain("exit_completed");
    expect(done.canAdvanceWorkflow).toBe(false);
    expect(done.status).toBe("Approved");
  });

  it("loads mock leaving steps", async () => {
    const steps = await getLeavingSteps();
    expect(steps.map((s) => s.status)).toEqual([
      "inform_employer",
      "submit_resignation",
      "accept_resignation",
      "handover_completed",
      "clearance_completed",
      "exit_completed",
    ]);
  });
});

describe("live exit advance routing", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("uses PATCH accept for accept_resignation and PUT for other steps", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await advanceLeavingStatus(
      {
        id: "9",
        employeeName: "Test",
        fadaId: "—",
        requestType: "Exit",
        fromTo: "Branch",
        branchId: "1",
        branchName: "Branch",
        requestedAt: "2026-08-19",
        status: "Pending",
        canDecide: true,
        canAdvanceWorkflow: true,
        completedSteps: ["inform_employer", "submit_resignation"],
      },
      "accept_resignation",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employer-leaving/9/status/accept",
      { method: "PATCH" },
    );

    await advanceLeavingStatus(
      {
        id: "9",
        employeeName: "Test",
        fadaId: "—",
        requestType: "Exit",
        fromTo: "Branch",
        branchId: "1",
        branchName: "Branch",
        requestedAt: "2026-08-19",
        status: "Accepted",
        canDecide: false,
        canAdvanceWorkflow: true,
        completedSteps: [
          "inform_employer",
          "submit_resignation",
          "accept_resignation",
        ],
      },
      "handover_completed",
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employer-leaving/9/status/handover_completed",
      { method: "PUT" },
    );
  });
});

describe("tab-scoped employment request loading", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("loads only join rows in mock mode for Join tab", async () => {
    const page = await getEmploymentRequestsPage({ type: "Join" });
    expect(page.list.items.every((row) => row.requestType === "Join")).toBe(true);
    expect(page.typeCounts.join).toBe(4);
    expect(page.typeCounts.exit).toBe(0);
  });

  it("loads only exit rows in mock mode for Exit tab", async () => {
    const page = await getEmploymentRequestsPage({ type: "Exit" });
    expect(page.list.items.every((row) => row.requestType === "Exit")).toBe(true);
    expect(page.typeCounts.exit).toBe(4);
  });

  it("merges cached tab counts after loading All", async () => {
    const page = await getEmploymentRequestsPage();
    expect(page.typeCounts.all).toBe(8);
    expect(page.typeCounts.join).toBe(4);
    expect(page.typeCounts.exit).toBe(4);
    expect(page.list.items.some((row) => row.requestType === "Join")).toBe(true);
    expect(page.list.items.some((row) => row.requestType === "Exit")).toBe(true);
  });

  it("fetches only invitations for Join tab in live mode", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    mockLiveEmploymentRequestsFetch();

    const page = await getEmploymentRequestsPage({ type: "Join" });

    expect(listFetchPaths()).toEqual(["/dealers/employer-invitations"]);
    expect(page.list.items.every((row) => row.requestType === "Join")).toBe(true);
  });

  it("fetches only leaving for Exit tab in live mode", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    mockLiveEmploymentRequestsFetch();

    const page = await getEmploymentRequestsPage({ type: "Exit" });

    expect(listFetchPaths()).toEqual(["/dealers/employer-leaving"]);
    expect(page.list.items.every((row) => row.requestType === "Exit")).toBe(true);
  });

  it("fetches both list endpoints for All tab in live mode", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    mockLiveEmploymentRequestsFetch();

    const page = await getEmploymentRequestsPage();

    expect(listFetchPaths()).toEqual([
      "/dealers/employer-invitations",
      "/dealers/employer-leaving",
    ]);
    expect(page.typeCounts.all).toBe(2);
    expect(page.list.items).toHaveLength(2);
  });
});

describe("live Join/Exit lists", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("loads invitations and leaving without transfer endpoints", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    mockLiveEmploymentRequestsFetch();

    const page = await getEmploymentRequestsPage();
    expect(page.list.items.some((r) => r.requestType === "Join")).toBe(true);
    expect(page.list.items.some((r) => r.requestType === "Exit")).toBe(true);
    expect(
      vi.mocked(apiFetch).mock.calls.some(([path]) =>
        String(path).includes("/dealers/employer-transfers"),
      ),
    ).toBe(false);

    const actions = await getEmploymentActionsPage();
    expect(actions.list.items.some((r) => r.actionType === "New Join")).toBe(true);
    expect(actions.list.items.some((r) => r.actionType === "Exit")).toBe(true);
  });
});

describe("unwrapDetailRecord", () => {
  it("unwraps array detail payloads by id", () => {
    const record = unwrapDetailRecord(
      {
        success: true,
        data: [
          { id: 48, employee: { name: "Other" } },
          { id: 49, employee: { name: "Apurv Gupta", fadaId: "FADA-2026-000015" } },
        ],
      },
      "49",
    ) as { employee: { name: string } };

    expect(record.employee.name).toBe("Apurv Gupta");
  });

  it("returns first array item when id is not provided", () => {
    const record = unwrapDetailRecord({
      data: [{ id: 1, employee: { name: "First" } }],
    }) as { employee: { name: string } };

    expect(record.employee.name).toBe("First");
  });
});

describe("reject mid-workflow", () => {
  afterEach(() => {
    resetEmploymentRequestsApiState();
  });

  it("rejects In Review join from accept_invitation step", async () => {
    const detail = await getInvitationDetail("inv-2");
    expect(detail.status).toBe("In Review");
    expect(detail.canAdvanceWorkflow).toBe(true);

    await updateRequestStatus(detail, "reject");

    const rejected = await getInvitationDetail("inv-2");
    expect(rejected.status).toBe("Rejected");
    expect(rejected.canDecide).toBe(false);
    expect(rejected.canAdvanceWorkflow).toBe(false);
    expect(rejected.rejectedAt).toBeTruthy();
    expect(
      rejected.history.some(
        (item) =>
          item.status === "reject_invitation" || item.status === "rejected",
      ),
    ).toBe(true);
  });

  it("rejects Accepted exit from accept_resignation workflow", async () => {
    const detail = await getLeavingDetail("leave-2");
    expect(detail.status).toBe("Accepted");
    expect(detail.completedSteps).toContain("accept_resignation");

    await updateRequestStatus(detail, "reject");

    const rejected = await getLeavingDetail("leave-2");
    expect(rejected.status).toBe("Rejected");
    expect(rejected.canDecide).toBe(false);
    expect(rejected.canAdvanceWorkflow).toBe(false);
    expect(rejected.rejectedAt).toBeTruthy();
    expect(
      rejected.history.some((item) => item.status === "reject_resignation"),
    ).toBe(true);
  });

  it("falls back to PUT reject_invitation when PATCH reject returns 400", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(
        new ApiError({ message: "Only pending can be rejected", status: 400 }),
      )
      .mockResolvedValueOnce({ success: true });

    await updateInvitationStatus("42", "reject");

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/dealers/employer-invitations/42/status/reject",
      { method: "PATCH" },
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/dealers/employer-invitations/42/status/reject_invitation",
      { method: "PUT" },
    );
  });

  it("uses PATCH reject for leaving without PUT fallback", async () => {
    vi.mocked(isMockMode).mockReturnValue(false);
    vi.mocked(apiFetch).mockResolvedValue({ success: true });

    await updateLeavingStatus("9", "reject");

    expect(apiFetch).toHaveBeenCalledWith(
      "/dealers/employer-leaving/9/status/reject",
      { method: "PATCH" },
    );
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
