import { describe, expect, it } from "vitest";

import {
  dealerProfileBannerMessage,
  dealerProfileStatusLabel,
  isDealerPortalLocked,
  parseDealerAccountStatus,
  portalLockMessage,
  portalLockTitle,
} from "@/features/dealership/status";

describe("parseDealerAccountStatus", () => {
  it("accepts known statuses case-insensitively", () => {
    expect(parseDealerAccountStatus("Approved")).toBe("approved");
    expect(parseDealerAccountStatus("PENDING")).toBe("pending");
    expect(parseDealerAccountStatus("temporary")).toBe("temporary");
    expect(parseDealerAccountStatus("rejected")).toBe("rejected");
  });

  it("defaults unknown values to pending", () => {
    expect(parseDealerAccountStatus("")).toBe("pending");
    expect(parseDealerAccountStatus("unknown")).toBe("pending");
  });
});

describe("isDealerPortalLocked", () => {
  it("unlocks only approved", () => {
    expect(isDealerPortalLocked("approved")).toBe(false);
    expect(isDealerPortalLocked("APPROVED")).toBe(false);
  });

  it("locks pending, temporary, rejected, and unknown", () => {
    expect(isDealerPortalLocked("pending")).toBe(true);
    expect(isDealerPortalLocked("temporary")).toBe(true);
    expect(isDealerPortalLocked("rejected")).toBe(true);
    expect(isDealerPortalLocked("")).toBe(true);
  });
});

describe("portal lock copy", () => {
  it("uses rejection-specific title and message", () => {
    expect(portalLockTitle("rejected")).toMatch(/not approved/i);
    expect(portalLockMessage("rejected")).toMatch(/not approved/i);
  });

  it("uses pending copy for other locked statuses", () => {
    expect(portalLockTitle("pending")).toMatch(/pending approval/i);
    expect(portalLockMessage("temporary")).toMatch(/not yet approved/i);
  });
});

describe("dealer profile banner", () => {
  it("hides banner when approved", () => {
    expect(dealerProfileBannerMessage("approved")).toBeNull();
  });

  it("returns status labels", () => {
    expect(dealerProfileStatusLabel("pending")).toBe("Pending review");
    expect(dealerProfileStatusLabel("approved")).toBe("Approved");
  });
});
