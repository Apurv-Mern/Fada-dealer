import { beforeEach, describe, expect, it, vi } from "vitest";

import { dealerLogout } from "@/features/auth/client-auth";
import {
  clearTokens,
  getAccessToken,
  setSession,
} from "@/features/auth/token-store";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue(undefined),
    getApiBaseUrl: () => "/api",
  };
});

describe("dealerLogout", () => {
  beforeEach(() => {
    clearTokens();
    setSession({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      profile: {
        email: "a@b.com",
        name: "A",
        role: "Admin",
      },
    });
  });

  it("clears tokens immediately without waiting on network", () => {
    expect(getAccessToken()).toBe("access-1");
    dealerLogout();
    expect(getAccessToken()).toBeNull();
  });
});
