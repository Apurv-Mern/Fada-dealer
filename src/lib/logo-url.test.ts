import { describe, expect, it } from "vitest";

import { extractLogoUrl } from "@/lib/logo-url";

describe("extractLogoUrl", () => {
  it("reads profilePicture from top-level record", () => {
    expect(
      extractLogoUrl({
        profilePicture: "https://api.fadaid.com/uploads/pic.png",
      }),
    ).toBe("https://api.fadaid.com/uploads/pic.png");
  });

  it("reads nested profile.profilePicture", () => {
    expect(
      extractLogoUrl({
        profile: {
          profilePicture: "https://api.fadaid.com/uploads/nested.png",
        },
      }),
    ).toBe("https://api.fadaid.com/uploads/nested.png");
  });

  it("prefers top-level profilePicture over nested fallbacks", () => {
    expect(
      extractLogoUrl({
        profilePicture: "https://api.fadaid.com/uploads/primary.png",
        profile: {
          profilePicture: "https://api.fadaid.com/uploads/nested.png",
        },
      }),
    ).toBe("https://api.fadaid.com/uploads/primary.png");
  });

  it("returns empty for nullish values", () => {
    expect(extractLogoUrl({ profilePicture: null })).toBe("");
    expect(extractLogoUrl({ profilePicture: "" })).toBe("");
    expect(extractLogoUrl({ profilePicture: "null" })).toBe("");
    expect(extractLogoUrl({})).toBe("");
  });
});
