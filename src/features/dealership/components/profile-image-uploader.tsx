"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";

import { toast } from "@/components/ui/toast";
import { toAuthErrorMessage } from "@/features/auth/client-auth";
import { uploadDealerProfilePicture } from "@/features/dealership/api";
import {
  PROFILE_IMAGE_ACCEPT,
  validateProfileImage,
} from "@/features/dealership/validate-profile-image";
import { displayValue } from "@/features/dealership/types";
import { toDisplayableFileUrl } from "@/lib/api";
import { cn } from "@/lib/utils/cn";

export function ProfileImageUploader({
  name,
  logoUrl,
  onUploaded,
}: {
  name: string;
  logoUrl: string;
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  const displayName = displayValue(name) || "Company";
  const propUrl = toDisplayableFileUrl(displayValue(logoUrl)) || null;
  const previewDisplayUrl = previewUrl
    ? toDisplayableFileUrl(previewUrl) || previewUrl
    : null;
  const candidateUrl = previewDisplayUrl ?? propUrl;
  const currentUrl =
    candidateUrl && brokenUrl === candidateUrl ? null : candidateUrl;
  const hasImage = Boolean(currentUrl);

  // After refresh, prefer the server URL and drop any temporary preview.
  useEffect(() => {
    setPreviewUrl(null);
    setBrokenUrl(null);
  }, [logoUrl]);

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || uploading) return;

    const validationError = validateProfileImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadDealerProfilePicture(file);
      setBrokenUrl(null);
      setPreviewUrl(url);
      toast.success("Profile image updated");
      onUploaded?.();
    } catch (err) {
      toast.error(toAuthErrorMessage(err, "Failed to upload profile image"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto sm:mx-0">
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        className="hidden"
        disabled={uploading}
        onChange={onFileChange}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        aria-label={
          hasImage
            ? `Change ${displayName} profile image`
            : `Upload ${displayName} profile image`
        }
        aria-busy={uploading || undefined}
        className={cn(
          "group relative inline-flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full",
          "border border-[var(--color-border)] bg-[var(--color-muted)]",
          "transition-opacity focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-70",
          !hasImage && "hover:bg-[var(--color-border)]/40",
        )}
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl!}
            alt={displayName}
            className="size-full object-cover"
            onError={() => {
              if (currentUrl) setBrokenUrl(currentUrl);
              setPreviewUrl(null);
            }}
          />
        ) : (
          <span className="flex flex-col items-center gap-1 px-2 text-center">
            <Upload
              className="size-5 text-[var(--color-text-muted)]"
              aria-hidden
            />
            <span className="text-[10px] font-semibold leading-tight text-[var(--color-text-muted)]">
              Upload Image
            </span>
          </span>
        )}

        {hasImage && !uploading ? (
          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-0.5",
              "bg-black/55 text-white opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
            aria-hidden
          >
            <Camera className="size-4" />
            <span className="text-[10px] font-semibold leading-tight">
              Change Image
            </span>
          </span>
        ) : null}

        {uploading ? (
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/45"
            aria-hidden
          >
            <span className="size-6 animate-spin rounded-full border-2 border-white border-r-transparent" />
          </span>
        ) : null}
      </button>
    </div>
  );
}
