import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileImageUploader } from "@/features/dealership/components/profile-image-uploader";
import { uploadDealerProfilePicture } from "@/features/dealership/api";
import { toast } from "@/components/ui/toast";

vi.mock("@/features/dealership/api", () => ({
  uploadDealerProfilePicture: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  Toaster: () => null,
}));

function selectFile(file: File) {
  const input = document.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  Object.defineProperty(input, "files", {
    configurable: true,
    value: [file],
  });
  fireEvent.change(input);
}

describe("ProfileImageUploader", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(uploadDealerProfilePicture).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it("shows Upload Image when no logo is present", () => {
    render(<ProfileImageUploader name="Test Motors" logoUrl="" />);
    expect(screen.getByText("Upload Image")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /upload test motors profile image/i }),
    ).toBeTruthy();
  });

  it("shows Change Image affordance when a logo exists", () => {
    render(
      <ProfileImageUploader
        name="Test Motors"
        logoUrl="https://api.fadaid.com/uploads/logo.png"
      />,
    );
    expect(screen.getByAltText("Test Motors")).toBeTruthy();
    expect(screen.getByText("Change Image")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /change test motors profile image/i }),
    ).toBeTruthy();
  });

  it("rejects invalid files before uploading", async () => {
    render(<ProfileImageUploader name="Test Motors" logoUrl="" />);
    selectFile(new File(["x"], "doc.pdf", { type: "application/pdf" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Only JPG, PNG, or WebP images are supported",
      );
    });
    expect(uploadDealerProfilePicture).not.toHaveBeenCalled();
  });

  it("uploads and shows the new image on success", async () => {
    const onUploaded = vi.fn();
    vi.mocked(uploadDealerProfilePicture).mockResolvedValue(
      "https://api.fadaid.com/uploads/new.png",
    );

    render(
      <ProfileImageUploader
        name="Test Motors"
        logoUrl=""
        onUploaded={onUploaded}
      />,
    );

    selectFile(new File(["img"], "logo.png", { type: "image/png" }));

    await waitFor(() => {
      expect(uploadDealerProfilePicture).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Profile image updated");
      expect(onUploaded).toHaveBeenCalled();
    });

    const img = screen.getByAltText("Test Motors") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(
      "https://api.fadaid.com/uploads/new.png",
    );
  });

  it("keeps the previous image when upload fails", async () => {
    vi.mocked(uploadDealerProfilePicture).mockRejectedValue(
      new Error("network"),
    );

    render(
      <ProfileImageUploader
        name="Test Motors"
        logoUrl="https://api.fadaid.com/uploads/old.png"
      />,
    );

    selectFile(new File(["img"], "logo.png", { type: "image/png" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    const img = screen.getByAltText("Test Motors") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(
      "https://api.fadaid.com/uploads/old.png",
    );
  });

  it("disables the picker while uploading", async () => {
    let resolveUpload: (url: string) => void = () => undefined;
    vi.mocked(uploadDealerProfilePicture).mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveUpload = resolve;
        }),
    );

    render(<ProfileImageUploader name="Test Motors" logoUrl="" />);
    const button = screen.getByRole("button", {
      name: /upload test motors profile image/i,
    });

    selectFile(new File(["img"], "logo.png", { type: "image/png" }));

    await waitFor(() => {
      expect(button).toHaveProperty("disabled", true);
      expect(button.getAttribute("aria-busy")).toBe("true");
    });

    resolveUpload("https://api.fadaid.com/uploads/done.png");
    await waitFor(() => {
      expect(button).toHaveProperty("disabled", false);
    });
  });
});
