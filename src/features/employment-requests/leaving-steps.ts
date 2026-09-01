import { isLeavingWorkflowStatus } from "@/features/employment-requests/types";

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

export const LEAVING_EXIT_STATUSES = [
  "inform_employer",
  "submit_resignation",
  "accept_resignation",
  "handover_completed",
  "clearance_completed",
  "exit_completed",
] as const;

export type LeavingExitStatus = (typeof LEAVING_EXIT_STATUSES)[number];

export function isLeavingExitStatus(value: string): value is LeavingExitStatus {
  return (LEAVING_EXIT_STATUSES as readonly string[]).includes(value);
}

export function nextLeavingExitStatus(
  completedSteps: string[] = [],
): LeavingExitStatus | null {
  return (
    LEAVING_EXIT_STATUSES.find((step) => !completedSteps.includes(step)) ?? null
  );
}

export function normalizeLeavingStepStatus(raw: string): string {
  const s = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (s.includes("handover")) return "handover_completed";
  if (s.includes("clearance")) return "clearance_completed";
  if (s.includes("exit_completed") || s === "exit" || s.includes("exit_complete")) {
    return "exit_completed";
  }
  return s;
}

export function collectCompletedLeavingSteps(raw: unknown): string[] {
  const record = asRecord(raw);
  const steps = new Set<string>();
  const statusRaw = normalizeLeavingStepStatus(
    readString(record, "status") || readString(record, "currentStatus"),
  );
  if (
    statusRaw &&
    statusRaw !== "pending" &&
    statusRaw !== "accepted" &&
    statusRaw !== "rejected" &&
    statusRaw !== "reject_resignation"
  ) {
    steps.add(statusRaw);
  }

  const historyKeys = [
    "history",
    "statusHistory",
    "statuses",
    "leavingStatuses",
    "employeeEmployerStatus",
    "steps",
  ];
  for (const key of historyKeys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      const row = asRecord(item);
      const slug = normalizeLeavingStepStatus(
        readString(row, "status") || readString(row, "slug"),
      );
      if (
        slug &&
        slug !== "pending" &&
        slug !== "accepted" &&
        slug !== "rejected" &&
        slug !== "leaving" &&
        slug !== "reject_resignation"
      ) {
        steps.add(slug);
      }
    }
  }

  const completed = Array.isArray(record.completedSteps)
    ? record.completedSteps
    : [];
  for (const item of completed) {
    const slug = normalizeLeavingStepStatus(String(item));
    if (slug) steps.add(slug);
  }

  if (steps.has("exit_completed")) {
    steps.add("handover_completed");
    steps.add("clearance_completed");
  } else if (steps.has("clearance_completed")) {
    steps.add("handover_completed");
  }

  return Array.from(steps);
}

export function collectWorkflowLeavingSteps(raw: unknown): string[] {
  return collectCompletedLeavingSteps(raw).filter((step) =>
    isLeavingWorkflowStatus(step),
  );
}
