import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildVisibleChipItems,
  filterChipItems,
  getChipPreviewHint,
  MasterChipSelect,
  toChipItems,
  type MasterChipItem,
} from "@/components/ui/master-chip-select";

const tenItems: MasterChipItem[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  name: `Item ${String(index + 1).padStart(2, "0")}`,
}));

describe("toChipItems", () => {
  it("maps select options to chip items", () => {
    expect(
      toChipItems([
        { label: "North", value: "n1" },
        { label: "South", value: "s1" },
      ]),
    ).toEqual([
      { id: "n1", name: "North" },
      { id: "s1", name: "South" },
    ]);
  });
});

describe("buildVisibleChipItems", () => {
  it("truncates to top 5 when query is empty", () => {
    const visible = buildVisibleChipItems(tenItems, "", 5, "");
    expect(visible).toHaveLength(5);
  });

  it("keeps selected item visible even if not in first 5", () => {
    const selectedId = "9";
    const visible = buildVisibleChipItems(tenItems, selectedId, 5, "");
    expect(visible.some((item) => item.id === selectedId)).toBe(true);
    expect(visible).toHaveLength(5);
    expect(visible[0]?.id).toBe(selectedId);
  });

  it("shows all matches when search query is set", () => {
    const filtered = filterChipItems(tenItems, "Item 0");
    const visible = buildVisibleChipItems(filtered, "", 5, "Item 0");
    expect(visible).toHaveLength(filtered.length);
  });
});

describe("getChipPreviewHint", () => {
  it("returns hint when list exceeds preview limit", () => {
    expect(getChipPreviewHint(10, 5, "")).toBe(
      "Showing 5 of 10. Search to find more.",
    );
  });

  it("hides hint when searching or list is short", () => {
    expect(getChipPreviewHint(10, 5, "Item")).toBeNull();
    expect(getChipPreviewHint(3, 5, "")).toBeNull();
  });
});

describe("MasterChipSelect", () => {
  it("clears selection from selected chip", () => {
    const onChange = vi.fn();
    render(
      <MasterChipSelect
        items={[
          { id: "1", name: "Alpha" },
          { id: "2", name: "Beta" },
        ]}
        value="1"
        onChange={onChange}
        searchAriaLabel="Search options"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Clear Alpha" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("shows preview hint for long lists", () => {
    render(
      <MasterChipSelect
        items={tenItems}
        value=""
        onChange={() => undefined}
        searchAriaLabel="Search options"
      />,
    );

    expect(
      screen.getByText("Showing 5 of 10. Search to find more."),
    ).toBeTruthy();
  });
});
