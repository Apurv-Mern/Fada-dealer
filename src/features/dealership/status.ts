export type DealerAccountStatus =
  | "temporary"
  | "pending"
  | "approved"
  | "rejected";

const KNOWN_STATUSES = new Set<string>([
  "temporary",
  "pending",
  "approved",
  "rejected",
]);

/** Normalize API status; unknown values treat as pending (locked). */
export function parseDealerAccountStatus(raw: string): DealerAccountStatus {
  const normalized = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (KNOWN_STATUSES.has(normalized)) {
    return normalized as DealerAccountStatus;
  }
  return "pending";
}

/** Portal is locked until admin sets status to approved. */
export function isDealerPortalLocked(status: string): boolean {
  return parseDealerAccountStatus(status) !== "approved";
}

export function portalLockTitle(status: DealerAccountStatus): string {
  if (status === "rejected") return "Profile not approved";
  return "Account pending approval";
}

export function portalLockMessage(status: DealerAccountStatus): string {
  if (status === "rejected") {
    return "Your company profile was not approved. Please update your Company Profile or contact FADA support if you believe this is an error. Other sections stay locked until an admin approves your account.";
  }
  return "Your company profile is not yet approved by FADA admin. Please complete your Company Profile. Other sections will unlock after admin approval.";
}

export function dealerProfileBannerMessage(
  status: DealerAccountStatus,
): string | null {
  if (status === "approved") return null;
  if (status === "rejected") {
    return "Your profile was not approved. Update your details and documents, then contact FADA support if you need help.";
  }
  return "Complete your profile details and documents. FADA admin will review and approve your account.";
}

export function dealerProfileStatusLabel(status: DealerAccountStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "temporary":
      return "Temporary";
    case "pending":
    default:
      return "Pending review";
  }
}
