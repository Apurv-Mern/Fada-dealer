import { isJoinWorkflowStatus } from "@/features/employment-requests/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export const JOIN_INVITATION_STATUSES = [
  "send_invitation",
  "accept_invitation",
  "share_details",
  "employer_verification",
  "joining_confirmed",
] as const;

export type JoinInvitationStatus = (typeof JOIN_INVITATION_STATUSES)[number];

export function isJoinInvitationStatus(
  value: string,
): value is JoinInvitationStatus {
  return (JOIN_INVITATION_STATUSES as readonly string[]).includes(value);
}

export function nextJoinInvitationStatus(
  completedSteps: string[] = [],
): JoinInvitationStatus | null {
  return (
    JOIN_INVITATION_STATUSES.find((step) => !completedSteps.includes(step)) ??
    null
  );
}

export function normalizeJoinStepStatus(raw: string): string {
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (s.includes("send") && s.includes("invitation")) return "send_invitation";
  if (s.includes("accept") && s.includes("invitation")) return "accept_invitation";
  if (s.includes("share") && s.includes("detail")) return "share_details";
  if (s.includes("employer") && s.includes("verif")) {
    return "employer_verification";
  }
  if (s.includes("joining") && s.includes("confirm")) return "joining_confirmed";
  return s;
}

export function collectCompletedJoinSteps(raw: unknown): string[] {
  const record = asRecord(raw);
  const steps = new Set<string>();
  const statusRaw = normalizeJoinStepStatus(
    readString(record, "status") || readString(record, "currentStatus"),
  );
  if (
    statusRaw &&
    statusRaw !== "pending" &&
    statusRaw !== "accepted" &&
    statusRaw !== "rejected" &&
    statusRaw !== "verified"
  ) {
    steps.add(statusRaw);
  }

  const historyKeys = [
    "history",
    "statusHistory",
    "statuses",
    "invitationStatuses",
    "employeeEmployerStatus",
    "steps",
  ];
  for (const key of historyKeys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const row = asRecord(item);
      const slug = normalizeJoinStepStatus(
        readString(row, "status") || readString(row, "slug"),
      );
      if (
        slug &&
        slug !== "pending" &&
        slug !== "accepted" &&
        slug !== "rejected" &&
        slug !== "verified"
      ) {
        steps.add(slug);
      }
    }
  }

  const completed = Array.isArray(record.completedSteps)
    ? record.completedSteps
    : [];
  for (const item of completed) {
    const slug = normalizeJoinStepStatus(String(item));
    if (slug) steps.add(slug);
  }

  if (steps.has("joining_confirmed")) {
    steps.add("send_invitation");
    steps.add("accept_invitation");
    steps.add("share_details");
    steps.add("employer_verification");
  } else if (steps.has("employer_verification")) {
    steps.add("send_invitation");
    steps.add("accept_invitation");
    steps.add("share_details");
  } else if (steps.has("share_details")) {
    steps.add("send_invitation");
    steps.add("accept_invitation");
  } else if (steps.has("accept_invitation")) {
    steps.add("send_invitation");
  }

  return Array.from(steps);
}

export function collectWorkflowJoinSteps(raw: unknown): string[] {
  return collectCompletedJoinSteps(raw).filter((step) =>
    isJoinWorkflowStatus(step),
  );
}
