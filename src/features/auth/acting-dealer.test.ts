import { beforeEach, describe, expect, it } from "vitest";

import { resolveActingDealerName } from "@/features/auth/acting-dealer";
import {
  clearTokens,
  setActingDealerId,
  setSession,
} from "@/features/auth/token-store";

const groupDealers = [
  { id: "2", name: "Western Auto", dealerCode: "CMP-002" },
  { id: "3", name: "City Motors" },
];

describe("resolveActingDealerName", () => {
  beforeEach(() => {
    clearTokens();
    setSession({
      accessToken: "access-1",
      profile: {
        id: "16",
        email: "holding@sundaram.com",
        name: "Holding Motors",
        role: "Admin",
        isGroupHoldingEntity: true,
      },
    });
  });

  it("uses the logged-in profile name when acting as self", () => {
    expect(resolveActingDealerName(groupDealers)).toBe("Holding Motors");
  });

  it("uses the switched child name and code", () => {
    setActingDealerId("2");
    expect(resolveActingDealerName(groupDealers)).toBe("Western Auto (CMP-002)");
  });

  it("uses the child name without a code", () => {
    setActingDealerId("3");
    expect(resolveActingDealerName(groupDealers)).toBe("City Motors");
  });

  it("falls back to the profile name for an unknown acting id", () => {
    setActingDealerId("999");
    expect(resolveActingDealerName(groupDealers)).toBe("Holding Motors");
  });

  it("falls back to the profile name when the group list is empty", () => {
    setActingDealerId("2");
    expect(resolveActingDealerName([])).toBe("Holding Motors");
  });
});
