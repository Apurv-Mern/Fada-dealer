import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar } from "@/components/ui/avatar";

describe("Avatar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders initials when no src is provided", () => {
    render(<Avatar name="Alex Motor Showroom" />);
    expect(screen.getByText("AM")).toBeTruthy();
  });

  it("renders an image when src is provided", () => {
    render(
      <Avatar
        name="Alex Motor Showroom"
        src="https://api.fadaid.com/uploads/logo.png"
      />,
    );
    const img = screen.getByRole("img", { name: "Alex Motor Showroom" });
    expect(img.getAttribute("src")).toBe(
      "https://api.fadaid.com/uploads/logo.png",
    );
  });

  it("falls back to initials when the image fails to load", () => {
    const { getByRole, getByText, queryByRole } = render(
      <Avatar
        name="Alex Motor Showroom"
        src="https://api.fadaid.com/uploads/broken.png"
      />,
    );
    fireEvent.error(getByRole("img", { name: "Alex Motor Showroom" }));
    expect(getByText("AM")).toBeTruthy();
    expect(queryByRole("img")).toBeNull();
  });
});
