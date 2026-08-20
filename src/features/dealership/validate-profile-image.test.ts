import { describe, expect, it } from "vitest";

import {
  PROFILE_IMAGE_MAX_BYTES,
  validateProfileImage,
} from "@/features/dealership/validate-profile-image";

describe("validateProfileImage", () => {
  it("rejects empty files", () => {
    const file = new File([], "empty.png", { type: "image/png" });
    expect(validateProfileImage(file)).toBe("Choose a non-empty image file");
  });

  it("accepts jpeg, png, and webp", () => {
    expect(
      validateProfileImage(
        new File(["x"], "a.jpg", { type: "image/jpeg" }),
      ),
    ).toBeNull();
    expect(
      validateProfileImage(
        new File(["x"], "a.png", { type: "image/png" }),
      ),
    ).toBeNull();
    expect(
      validateProfileImage(
        new File(["x"], "a.webp", { type: "image/webp" }),
      ),
    ).toBeNull();
  });

  it("accepts files by extension when MIME is missing", () => {
    expect(
      validateProfileImage(new File(["x"], "logo.JPEG", { type: "" })),
    ).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(
      validateProfileImage(
        new File(["x"], "doc.pdf", { type: "application/pdf" }),
      ),
    ).toBe("Only JPG, PNG, or WebP images are supported");
  });

  it("rejects files larger than 5MB", () => {
    const big = new File(
      [new Uint8Array(PROFILE_IMAGE_MAX_BYTES + 1)],
      "big.png",
      { type: "image/png" },
    );
    expect(validateProfileImage(big)).toBe("Image must be 5MB or smaller");
  });
});
