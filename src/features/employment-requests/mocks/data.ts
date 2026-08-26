import {
  type EmploymentRequest,
  type EmploymentRequestFilterOptions,
  type InvitationDetail,
  type LeavingDetail,
  type LeavingHistoryItem,
  type LeavingStep,
  type LeavingExitStatus,
} from "@/features/employment-requests/types";
import {
  collectCompletedLeavingSteps,
  nextLeavingExitStatus,
} from "@/features/employment-requests/leaving-steps";
import {
  collectCompletedJoinSteps,
  isDealerActor,
  nextDealerJoinStatus,
  type JoinInvitationStatus,
} from "@/features/employment-requests/joining-steps";
import { ApiError } from "@/lib/api/errors";

export const employmentRequestFilterOptions: EmploymentRequestFilterOptions = {
  branches: [
    { label: "Andheri West", value: "andheri" },
    { label: "Pune Service", value: "pune" },
    { label: "Thane Sales", value: "thane" },
  ],
};

export const mockLeavingSteps: LeavingStep[] = [
  {
    id: "1",
    status: "inform_employer",
    title: "Inform Employer",
    description: "Employee has informed the employer about leaving",
  },
  {
    id: "2",
    status: "submit_resignation",
    title: "Submit Resignation",
    description: "Resignation details have been submitted",
  },
  {
    id: "3",
    status: "accept_resignation",
    title: "Accept Resignation",
    description: "Dealer accepts or rejects the resignation",
  },
  {
    id: "4",
    status: "handover_completed",
    title: "Handover Completed",
    description: "Handover of responsibilities is completed",
  },
  {
    id: "5",
    status: "clearance_completed",
    title: "Clearance Completed",
    description: "Exit clearance is completed",
  },
  {
    id: "6",
    status: "exit_completed",
    title: "Exit Completed",
    description: "Employment exit is finalized",
  },
];

export const mockInvitationSteps: LeavingStep[] = [
  {
    id: "1",
    status: "send_invitation",
    title: "Send Invitation",
    description: "Invitation has been sent to the employee",
  },
  {
    id: "2",
    status: "accept_invitation",
    title: "Accept Invitation",
    description: "Employee accepts the join invitation",
  },
  {
    id: "3",
    status: "share_details",
    title: "Share Details",
    description: "Employee shares required joining details",
  },
  {
    id: "4",
    status: "employer_verification",
    title: "Employer Verification",
    description: "Dealer verifies employee documents and details",
  },
  {
    id: "5",
    status: "joining_confirmed",
    title: "Joining Confirmed",
    description: "Employment join is finalized",
  },
];

type LeavingExtra = {
  history: LeavingHistoryItem[];
  resignationDate?: string;
  lastWorkingDay?: string;
  reason?: string;
};

const initialLeavingExtra: Record<string, LeavingExtra> = {
  "leave-1": {
    resignationDate: "2026-03-27",
    lastWorkingDay: "2026-04-10",
    reason: "Personal reasons",
    history: [
      {
        id: "h-1",
        status: "pending",
        createdAt: "2026-03-27T09:00:00.000Z",
      },
    ],
  },
  "leave-2": {
    resignationDate: "2026-03-12",
    lastWorkingDay: "2026-03-31",
    reason: "Relocation",
    history: [
      {
        id: "h-2a",
        status: "inform_employer",
        createdAt: "2026-03-12T09:00:00.000Z",
      },
      {
        id: "h-2b",
        status: "submit_resignation",
        createdAt: "2026-03-12T10:00:00.000Z",
      },
      {
        id: "h-2c",
        status: "accept_resignation",
        createdAt: "2026-03-13T10:00:00.000Z",
      },
      {
        id: "h-2d",
        status: "handover_completed",
        createdAt: "2026-03-18T11:00:00.000Z",
      },
    ],
  },
  "leave-3": {
    resignationDate: "2026-03-08",
    reason: "Notice withdrawn",
    history: [
      {
        id: "h-3",
        status: "reject_resignation",
        createdAt: "2026-03-09T08:30:00.000Z",
      },
    ],
  },
  "leave-4": {
    resignationDate: "2026-02-20",
    lastWorkingDay: "2026-03-06",
    reason: "Career change",
    history: [
      {
        id: "h-4a",
        status: "accept_resignation",
        createdAt: "2026-02-21T10:00:00.000Z",
      },
      {
        id: "h-4b",
        status: "handover_completed",
        createdAt: "2026-02-25T10:00:00.000Z",
      },
      {
        id: "h-4c",
        status: "clearance_completed",
        createdAt: "2026-03-02T10:00:00.000Z",
      },
      {
        id: "h-4d",
        status: "exit_completed",
        createdAt: "2026-03-06T10:00:00.000Z",
      },
    ],
  },
};

let mockLeavingExtra: Record<string, LeavingExtra> = structuredClone(
  initialLeavingExtra,
);

type InvitationExtra = {
  history: LeavingHistoryItem[];
  departmentName?: string;
  designationName?: string;
  mobile?: string;
};

const initialInvitationExtra: Record<string, InvitationExtra> = {
  "inv-1": {
    departmentName: "Sales",
    designationName: "Sales Executive",
    mobile: "+91 98765 43210",
    history: [
      {
        id: "h-inv-1",
        status: "pending",
        createdAt: "2026-03-28T09:00:00.000Z",
      },
    ],
  },
  "inv-2": {
    departmentName: "Service",
    designationName: "Service Advisor",
    mobile: "+91 91234 56789",
    history: [
      {
        id: "h-inv-2a",
        status: "send_invitation",
        actionUserBy: "dealer",
        actionUserName: "Andheri Motors",
        createdAt: "2026-03-25T09:00:00.000Z",
      },
      {
        id: "h-inv-2b",
        status: "accept_invitation",
        actionUserBy: "employee",
        actionUserName: "Vikram Shah",
        createdAt: "2026-03-25T11:00:00.000Z",
      },
      {
        id: "h-inv-2c",
        status: "share_details",
        actionUserBy: "employee",
        actionUserName: "Vikram Shah",
        createdAt: "2026-03-26T10:00:00.000Z",
      },
    ],
  },
  "inv-3": {
    departmentName: "Sales",
    designationName: "Team Lead",
    mobile: "+91 99887 76655",
    history: [
      {
        id: "h-inv-3a",
        status: "send_invitation",
        actionUserBy: "employee",
        actionUserName: "Ananya Iyer",
        createdAt: "2026-03-20T09:00:00.000Z",
      },
      {
        id: "h-inv-3b",
        status: "accept_invitation",
        actionUserBy: "dealer",
        actionUserName: "Thane Sales Dealer",
        createdAt: "2026-03-20T11:00:00.000Z",
      },
      {
        id: "h-inv-3c",
        status: "share_details",
        actionUserBy: "employee",
        actionUserName: "Ananya Iyer",
        createdAt: "2026-03-21T10:00:00.000Z",
      },
      {
        id: "h-inv-3d",
        status: "employer_verification",
        actionUserBy: "dealer",
        actionUserName: "Thane Sales Dealer",
        createdAt: "2026-03-22T14:00:00.000Z",
      },
      {
        id: "h-inv-3e",
        status: "joining_confirmed",
        actionUserBy: "dealer",
        actionUserName: "Thane Sales Dealer",
        createdAt: "2026-03-23T16:00:00.000Z",
      },
    ],
  },
  "inv-4": {
    departmentName: "Sales",
    designationName: "Sales Executive",
    mobile: "+91 90000 11122",
    history: [
      {
        id: "h-inv-4",
        status: "rejected",
        createdAt: "2026-03-19T08:30:00.000Z",
      },
    ],
  },
};

let mockInvitationExtra: Record<string, InvitationExtra> = structuredClone(
  initialInvitationExtra,
);

const initialEmploymentRequests: EmploymentRequest[] = [
  {
    id: "inv-1",
    employeeName: "Sneha Kapoor",
    fadaId: "MH/2024/SK/2101",
    requestType: "Join",
    fromTo: "Andheri West",
    branchId: "andheri",
    branchName: "Andheri West",
    requestedAt: "2026-03-28",
    status: "Pending",
    canDecide: true,
    departmentName: "Sales",
    designationName: "Sales Executive",
    mobile: "+91 98765 43210",
  },
  {
    id: "inv-2",
    employeeName: "Vikram Shah",
    fadaId: "MH/2023/VS/1540",
    requestType: "Join",
    fromTo: "Pune Service",
    branchId: "pune",
    branchName: "Pune Service",
    requestedAt: "2026-03-25",
    status: "In Review",
    canDecide: false,
    canAdvanceWorkflow: true,
    completedSteps: [
      "send_invitation",
      "accept_invitation",
      "share_details",
    ],
    departmentName: "Service",
    designationName: "Service Advisor",
    mobile: "+91 91234 56789",
  },
  {
    id: "inv-3",
    employeeName: "Ananya Iyer",
    fadaId: "MH/2022/AI/0888",
    requestType: "Join",
    fromTo: "Thane Sales",
    branchId: "thane",
    branchName: "Thane Sales",
    requestedAt: "2026-03-20",
    status: "Approved",
    canDecide: false,
    canAdvanceWorkflow: false,
    completedSteps: [
      "send_invitation",
      "accept_invitation",
      "share_details",
      "employer_verification",
      "joining_confirmed",
    ],
    departmentName: "Sales",
    designationName: "Team Lead",
    mobile: "+91 99887 76655",
  },
  {
    id: "inv-4",
    employeeName: "Karan Desai",
    fadaId: "MH/2024/KD/3012",
    requestType: "Join",
    fromTo: "Andheri West",
    branchId: "andheri",
    branchName: "Andheri West",
    requestedAt: "2026-03-18",
    status: "Rejected",
    canDecide: false,
    departmentName: "Sales",
    designationName: "Sales Executive",
    mobile: "+91 90000 11122",
  },
  {
    id: "leave-1",
    employeeName: "Meera Joshi",
    fadaId: "MH/2021/MJ/0440",
    requestType: "Exit",
    fromTo: "Pune Service",
    branchId: "pune",
    branchName: "Pune Service",
    requestedAt: "2026-03-27",
    status: "Pending",
    canDecide: true,
    canAdvanceWorkflow: true,
    resignationDate: "2026-03-27",
    lastWorkingDay: "2026-04-10",
    reason: "Personal reasons",
  },
  {
    id: "leave-2",
    employeeName: "Rahul Nair",
    fadaId: "MH/2023/RN/0777",
    requestType: "Exit",
    fromTo: "Thane Sales",
    branchId: "thane",
    branchName: "Thane Sales",
    requestedAt: "2026-03-12",
    status: "Accepted",
    canDecide: false,
    canAdvanceWorkflow: true,
    completedSteps: [
      "inform_employer",
      "submit_resignation",
      "accept_resignation",
      "handover_completed",
    ],
    resignationDate: "2026-03-12",
    lastWorkingDay: "2026-03-31",
    reason: "Relocation",
  },
  {
    id: "leave-3",
    employeeName: "Priya Menon",
    fadaId: "MH/2022/PM/0610",
    requestType: "Exit",
    fromTo: "Andheri West",
    branchId: "andheri",
    branchName: "Andheri West",
    requestedAt: "2026-03-08",
    status: "Rejected",
    canDecide: false,
    resignationDate: "2026-03-08",
    reason: "Notice withdrawn",
  },
  {
    id: "leave-4",
    employeeName: "Amit Verma",
    fadaId: "MH/2024/AV/1042",
    requestType: "Exit",
    fromTo: "Andheri West",
    branchId: "andheri",
    branchName: "Andheri West",
    requestedAt: "2026-02-20",
    status: "Approved",
    canDecide: false,
    canAdvanceWorkflow: false,
    completedSteps: [
      "handover_completed",
      "clearance_completed",
      "exit_completed",
    ],
    resignationDate: "2026-02-20",
    lastWorkingDay: "2026-03-06",
    reason: "Career change",
  },
];

/** Mutable mock store so accept/reject can update status in-session. */
export let mockEmploymentRequests: EmploymentRequest[] =
  initialEmploymentRequests.map((r) => ({
    ...r,
    completedSteps: r.completedSteps ? [...r.completedSteps] : undefined,
  }));

export function resetMockEmploymentRequests(
  next: EmploymentRequest[] = initialEmploymentRequests.map((r) => ({
    ...r,
    completedSteps: r.completedSteps ? [...r.completedSteps] : undefined,
  })),
) {
  mockEmploymentRequests = next;
  mockLeavingExtra = structuredClone(initialLeavingExtra);
  mockInvitationExtra = structuredClone(initialInvitationExtra);
}

export function updateMockRequestStatus(
  id: string,
  status: "Approved" | "Rejected",
) {
  mockEmploymentRequests = mockEmploymentRequests.map((row) => {
    if (row.id !== id) return row;
    const isExitAccept = status === "Approved" && row.requestType === "Exit";
    const isJoinAccept = status === "Approved" && row.requestType === "Join";
    const nextCompleted = isExitAccept
      ? [...new Set([...(row.completedSteps ?? []), "accept_resignation"])]
      : isJoinAccept
        ? [
            ...new Set([
              ...(row.completedSteps ?? []),
              "send_invitation",
              "accept_invitation",
            ]),
          ]
        : (row.completedSteps ?? []);

    if (isExitAccept) {
      const extra = mockLeavingExtra[id] ?? { history: [] };
      if (!extra.history.some((item) => item.status === "accept_resignation")) {
        mockLeavingExtra[id] = {
          ...extra,
          history: [
            ...extra.history,
            {
              id: `h-${id}-accept_resignation`,
              status: "accept_resignation",
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }
    }

    if (isJoinAccept) {
      const extra = mockInvitationExtra[id] ?? { history: [] };
      const history = [...extra.history];
      for (const step of ["send_invitation", "accept_invitation"] as const) {
        if (!history.some((item) => item.status === step)) {
          history.push({
            id: `h-${id}-${step}`,
            status: step,
            createdAt: new Date().toISOString(),
          });
        }
      }
      mockInvitationExtra[id] = { ...extra, history };
    }

    if (status === "Rejected" && row.requestType === "Join") {
      const extra = mockInvitationExtra[id] ?? { history: [] };
      mockInvitationExtra[id] = {
        ...extra,
        history: [
          ...extra.history,
          {
            id: `h-${id}-rejected`,
            status: "rejected",
            createdAt: new Date().toISOString(),
          },
        ],
      };
    }

    return {
      ...row,
      status: isExitAccept
        ? "Accepted"
        : isJoinAccept
          ? "In Review"
          : status,
      canDecide: false,
      canAdvanceWorkflow: isExitAccept || isJoinAccept,
      completedSteps: nextCompleted,
    };
  });
}

export function addMockJoinInvitation(row: EmploymentRequest) {
  mockEmploymentRequests = [{ ...row }, ...mockEmploymentRequests];
  mockInvitationExtra[row.id] = {
    departmentName: row.departmentName,
    designationName: row.designationName,
    mobile: row.mobile,
    history: [
      {
        id: `h-${row.id}-send`,
        status: "send_invitation",
        actionUserBy: "dealer",
        actionUserName: "Dealer",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function getMockLeavingDetail(id: string): LeavingDetail {
  const row = mockEmploymentRequests.find((item) => item.id === id);
  if (!row || row.requestType !== "Exit") {
    throw new ApiError({ message: "Leaving request not found", status: 404 });
  }
  const extra = mockLeavingExtra[id] ?? { history: [] };
  return {
    ...row,
    resignationDate: row.resignationDate ?? extra.resignationDate,
    lastWorkingDay: row.lastWorkingDay ?? extra.lastWorkingDay,
    reason: row.reason ?? extra.reason,
    history: extra.history,
    completedSteps: collectCompletedLeavingSteps({
      ...row,
      statuses: extra.history,
    }),
  };
}

export function getMockInvitationDetail(id: string): InvitationDetail {
  const row = mockEmploymentRequests.find((item) => item.id === id);
  if (!row || row.requestType !== "Join") {
    throw new ApiError({ message: "Join request not found", status: 404 });
  }
  const extra = mockInvitationExtra[id] ?? { history: [] };
  const completedSteps = collectCompletedJoinSteps({
    ...row,
    statuses: extra.history,
  });
  const sendRow = extra.history.find(
    (item) => item.status === "send_invitation",
  );
  const sendInvitationByDealer = isDealerActor(sendRow?.actionUserBy);
  const sendInvitationActorName =
    sendRow?.actionUserName ||
    (sendInvitationByDealer ? "Dealer" : row.employeeName);
  return {
    ...row,
    departmentName: row.departmentName ?? extra.departmentName,
    designationName: row.designationName ?? extra.designationName,
    mobile: row.mobile ?? extra.mobile,
    history: extra.history,
    completedSteps,
    sendInvitationByDealer,
    sendInvitationActorName,
    canAdvanceWorkflow:
      row.status !== "Rejected" &&
      row.status !== "Approved" &&
      nextDealerJoinStatus(completedSteps, sendInvitationByDealer) !== null,
  };
}

export function advanceMockInvitationStatus(
  id: string,
  status: JoinInvitationStatus,
) {
  const row = mockEmploymentRequests.find((item) => item.id === id);
  if (!row || row.requestType !== "Join") {
    throw new ApiError({ message: "Join request not found", status: 404 });
  }
  if (row.status === "Rejected") {
    throw new ApiError({
      message: "Cannot advance a rejected join request",
      status: 400,
    });
  }

  const completed = collectCompletedJoinSteps({
    ...row,
    statuses: mockInvitationExtra[id]?.history ?? [],
  });
  if (completed.includes(status)) {
    throw new ApiError({
      message: "Status already updated",
      status: 400,
    });
  }
  const sendRow = (mockInvitationExtra[id]?.history ?? []).find(
    (item) => item.status === "send_invitation",
  );
  const sendByDealer = isDealerActor(sendRow?.actionUserBy);
  const expected = nextDealerJoinStatus(completed, sendByDealer);
  if (expected !== status) {
    throw new ApiError({
      message: "Complete the previous join step first",
      status: 400,
    });
  }

  const nextCompleted = [...completed, status];
  const done = status === "joining_confirmed";

  mockEmploymentRequests = mockEmploymentRequests.map((item) =>
    item.id === id
      ? {
          ...item,
          completedSteps: nextCompleted,
          canDecide: false,
          canAdvanceWorkflow:
            !done &&
            nextDealerJoinStatus(nextCompleted, sendByDealer) !== null,
          status: done ? "Approved" : "In Review",
        }
      : item,
  );

  const extra = mockInvitationExtra[id] ?? { history: [] };
  mockInvitationExtra[id] = {
    ...extra,
    history: [
      ...extra.history,
      {
        id: `h-${id}-${status}`,
        status,
        actionUserBy: "dealer",
        actionUserName: "Dealer",
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function advanceMockLeavingStatus(
  id: string,
  status: LeavingExitStatus,
) {
  const row = mockEmploymentRequests.find((item) => item.id === id);
  if (!row || row.requestType !== "Exit") {
    throw new ApiError({ message: "Leaving request not found", status: 404 });
  }
  if (row.status === "Rejected") {
    throw new ApiError({
      message: "Cannot advance a rejected exit request",
      status: 400,
    });
  }

  const completed = collectCompletedLeavingSteps({
    ...row,
    statuses: mockLeavingExtra[id]?.history ?? [],
  });
  if (completed.includes(status)) {
    throw new ApiError({
      message: "Status already updated",
      status: 400,
    });
  }
  const expected = nextLeavingExitStatus(completed);
  if (expected !== status) {
    throw new ApiError({
      message: "Complete the previous exit step first",
      status: 400,
    });
  }

  const nextCompleted = [...completed, status];
  const done = status === "exit_completed";
  const accepted = status === "accept_resignation" || row.status === "Accepted";

  mockEmploymentRequests = mockEmploymentRequests.map((item) =>
    item.id === id
      ? {
          ...item,
          completedSteps: nextCompleted,
          canDecide: false,
          canAdvanceWorkflow: !done,
          status: done ? "Approved" : accepted ? "Accepted" : item.status,
        }
      : item,
  );

  const extra = mockLeavingExtra[id] ?? { history: [] };
  mockLeavingExtra[id] = {
    ...extra,
    history: [
      ...extra.history,
      {
        id: `h-${id}-${status}`,
        status,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
