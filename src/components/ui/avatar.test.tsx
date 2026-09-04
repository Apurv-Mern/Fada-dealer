import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Avatar } from "@/components/ui/avatar";

describe("Avatar", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_USE_PROXY", "true");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.fadaid.com");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders initials when no src is provided", () => {
    render(<Avatar name="Alex Motor Showroom" />);
    expect(screen.getByText("AM")).toBeTruthy();
  });

  it("prefers same-origin /api candidate for API-hosted src", () => {
    render(
      <Avatar
        name="Alex Motor Showroom"
        src="https://api.fadaid.com/uploads/logo.png"
      />,
    );
    const img = screen.getByRole("img", { name: "Alex Motor Showroom" });
    expect(img.getAttribute("src")).toBe("/api/uploads/logo.png");
  });

  it("falls back to absolute API URL when /api candidate fails", () => {
    render(
      <Avatar
        name="Alex Motor Showroom"
        src="https://api.fadaid.com/uploads/logo.png"
      />,
    );

    fireEvent.error(screen.getByRole("img", { name: "Alex Motor Showroom" }));

    const img = screen.getByRole("img", { name: "Alex Motor Showroom" });
    expect(img.getAttribute("src")).toBe(
      "https://api.fadaid.com/uploads/logo.png",
    );
  });

  it("falls back to initials when all candidates fail", () => {
    const { getByRole, getByText, queryByRole } = render(
      <Avatar
        name="Alex Motor Showroom"
        src="https://api.fadaid.com/uploads/broken.png"
      />,
    );

    fireEvent.error(getByRole("img", { name: "Alex Motor Showroom" }));
    fireEvent.error(getByRole("img", { name: "Alex Motor Showroom" }));

    expect(getByText("AM")).toBeTruthy();
    expect(queryByRole("img")).toBeNull();
  });
});
