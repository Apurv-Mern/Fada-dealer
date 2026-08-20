import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { YearPickerField } from "@/features/dealership/components/year-picker-field";

describe("YearPickerField", () => {
  it("calls onChange with selected year and closes popover", () => {
    const onChange = vi.fn();
    const currentYear = new Date().getFullYear();

    render(
      <YearPickerField
        label="Year of establishment"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Open year picker"));
    fireEvent.click(screen.getByRole("button", { name: String(currentYear) }));

    expect(onChange).toHaveBeenCalledWith(String(currentYear));
    expect(screen.queryByRole("dialog", { name: "Choose year" })).toBeNull();
  });
});
