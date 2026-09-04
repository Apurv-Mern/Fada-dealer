import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/layout/app-header";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/notifications/components/notifications-bell-dropdown", () => ({
  NotificationsBellDropdown: () => null,
}));

describe("AppHeader avatar", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "true");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("shows company logo in the account avatar when userAvatarUrl is set", () => {
    render(
      <AppHeader
        userName="Alex motor showroom"
        userRole="Dealer Admin"
        userEmail="alx28@mailinator.com"
        userAvatarUrl="https://api.fadaid.com/uploads/1787304300283-872733348.png"
      />,
    );

    const img = screen.getByRole("img", { name: "Alex motor showroom" });
    expect(img.getAttribute("src")).toBe(
      "/api/uploads/1787304300283-872733348.png",
    );
  });

  it("falls back to absolute API URL when /api avatar candidate fails", () => {
    render(
      <AppHeader
        userName="Alex motor showroom"
        userRole="Dealer Admin"
        userEmail="alx28@mailinator.com"
        userAvatarUrl="https://api.fadaid.com/uploads/1787304300283-872733348.png"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Alex motor showroom" }));

    const img = screen.getByRole("img", { name: "Alex motor showroom" });
    expect(img.getAttribute("src")).toBe(
      "https://api.fadaid.com/uploads/1787304300283-872733348.png",
    );
  });

  it("shows initials when userAvatarUrl is missing", () => {
    render(
      <AppHeader
        userName="Alex motor showroom"
        userRole="Dealer Admin"
        userEmail="alx28@mailinator.com"
      />,
    );

    expect(screen.getByText("AM")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
