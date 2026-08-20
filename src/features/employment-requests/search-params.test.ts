import { describe, expect, it } from "vitest";

import { applyEmploymentRequestsQueryPatch } from "@/features/employment-requests/search-params";

describe("applyEmploymentRequestsQueryPatch", () => {
  it("clears type when switching back to All Requests", () => {
    const params = applyEmploymentRequestsQueryPatch("type=Join", {
      page: 1,
      type: "",
    });

    expect(params.get("type")).toBeNull();
    expect(params.toString()).toBe("");
  });

  it("sets type when switching to Join or Exit", () => {
    const join = applyEmploymentRequestsQueryPatch("", { type: "Join" });
    expect(join.get("type")).toBe("Join");

    const exit = applyEmploymentRequestsQueryPatch("type=Join", { type: "Exit" });
    expect(exit.get("type")).toBe("Exit");
  });

  it("clears type but preserves other filters", () => {
    const params = applyEmploymentRequestsQueryPatch(
      "type=Join&status=Pending",
      { type: "" },
    );

    expect(params.get("type")).toBeNull();
    expect(params.get("status")).toBe("Pending");
  });

  it("clears search and pagination defaults", () => {
    const params = applyEmploymentRequestsQueryPatch(
      "q=test&page=2&pageSize=20",
      { q: "", page: 1, pageSize: 10 },
    );

    expect(params.get("q")).toBeNull();
    expect(params.get("page")).toBeNull();
    expect(params.get("pageSize")).toBeNull();
  });

  it("leaves untouched params when not included in patch", () => {
    const params = applyEmploymentRequestsQueryPatch("type=Join&status=Pending", {
      page: 2,
    });

    expect(params.get("type")).toBe("Join");
    expect(params.get("status")).toBe("Pending");
    expect(params.get("page")).toBe("2");
  });
});
