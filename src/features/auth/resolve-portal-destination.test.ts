import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/dealership/api", () => ({
  getDealerProfile: vi.fn(),
}));

import { getDealerProfile } from "@/features/dealership/api";
import { resolvePortalDestination } from "@/features/auth/resolve-portal-destination";
import { routes } from "@/config/navigation";

const getDealerProfileMock = vi.mocked(getDealerProfile);

describe("resolvePortalDestination", () => {
  beforeEach(() => {
    getDealerProfileMock.mockReset();
  });

  it("sends locked dealers to dealership and ignores next", async () => {
    getDealerProfileMock.mockResolvedValue({ status: "pending" } as never);
    await expect(resolvePortalDestination("/employees")).resolves.toBe(
      routes.dealership,
    );
  });

  it("sends approved dealers to employees by default", async () => {
    getDealerProfileMock.mockResolvedValue({ status: "approved" } as never);
    await expect(resolvePortalDestination()).resolves.toBe(routes.employees);
  });

  it("honors safe next for approved dealers", async () => {
    getDealerProfileMock.mockResolvedValue({ status: "approved" } as never);
    await expect(resolvePortalDestination("/branches")).resolves.toBe(
      "/branches",
    );
  });

  it("rejects auth next paths for approved dealers", async () => {
    getDealerProfileMock.mockResolvedValue({ status: "approved" } as never);
    await expect(resolvePortalDestination("/login")).resolves.toBe(
      routes.employees,
    );
  });

  it("throws when profile fetch fails", async () => {
    getDealerProfileMock.mockRejectedValue(new Error("network"));
    await expect(resolvePortalDestination()).rejects.toThrow("network");
  });
});
