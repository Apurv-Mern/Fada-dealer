import { describe, expect, it } from "vitest";

import { sessionFromAuthBody } from "@/features/auth/auth-utils";
import type { AuthTokenResponse } from "@/types/api";

describe("sessionFromAuthBody logoUrl", () => {
  it("maps dealer.profilePicture onto logoUrl", () => {
    const body: AuthTokenResponse = {
      success: true,
      accessToken: "token",
      dealer: {
        id: 16,
        name: "Alex motor showroom",
        email: "alx28@mailinator.com",
        role: "dealer_admin",
        profilePicture: "https://api.fadaid.com/uploads/logo.png",
      },
    };

    expect(sessionFromAuthBody(body, "alx28@mailinator.com").logoUrl).toBe(
      "https://api.fadaid.com/uploads/logo.png",
    );
  });

  it("maps nested data.profilePicture onto logoUrl", () => {
    const body: AuthTokenResponse = {
      success: true,
      data: {
        accessToken: "token",
        profilePicture: "https://api.fadaid.com/uploads/nested.png",
        user: {
          email: "staff@example.com",
          name: "Staff User",
        },
      },
    };

    expect(sessionFromAuthBody(body, "staff@example.com").logoUrl).toBe(
      "https://api.fadaid.com/uploads/nested.png",
    );
  });

  it("omits logoUrl when auth body has no image fields", () => {
    const body: AuthTokenResponse = {
      success: true,
      dealer: {
        id: 16,
        name: "Test Motors",
        email: "test@example.com",
      },
    };

    expect(sessionFromAuthBody(body, "test@example.com").logoUrl).toBeUndefined();
  });
});
