import { describe, expect, it } from "vitest";

import { toggleOutletFunctionIds } from "@/features/branches/components/branches-add-dialog";

describe("toggleOutletFunctionIds", () => {
  it("adds an id that is not selected", () => {
    expect(toggleOutletFunctionIds(["1"], "2")).toEqual(["1", "2"]);
  });

  it("removes an id that is already selected", () => {
    expect(toggleOutletFunctionIds(["1", "2"], "1")).toEqual(["2"]);
  });
});
