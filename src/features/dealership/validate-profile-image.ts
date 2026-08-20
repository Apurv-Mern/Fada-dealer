const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

/** Max profile image size: 5 MiB. */
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function hasAcceptedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Client check before profile image upload: non-empty JPG/PNG/WebP, ≤ 5 MiB.
 * Returns an error message, or null when valid.
 */
export function validateProfileImage(file: File): string | null {
  if (!file.size) return "Choose a non-empty image file";

  const typeOk = ACCEPTED_TYPES.has(file.type);
  const extOk = hasAcceptedExtension(file.name);
  if (!typeOk && !extOk) {
    return "Only JPG, PNG, or WebP images are supported";
  }

  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return "Image must be 5MB or smaller";
  }

  return null;
}
