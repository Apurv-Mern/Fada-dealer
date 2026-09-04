"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  /** When no `src`: show initials (default) or an empty muted circle. */
  fallback?: "initials" | "blank";
  className?: string;
};

const sizeMap = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
  xl: "size-24 text-2xl",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarInitials({
  name,
  size,
  className,
}: {
  name: string;
  size: AvatarProps["size"];
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] font-semibold text-white",
        sizeMap[size ?? "md"],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
  fallback = "initials",
  className,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeMap[size],
          className,
        )}
        onError={() => setImageFailed(true)}
      />
    );
  }

  if (fallback === "blank") {
    return (
      <span
        aria-label={`${name || "Profile"} photo placeholder`}
        className={cn(
          "inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]",
          sizeMap[size],
          className,
        )}
      />
    );
  }

  return <AvatarInitials name={name} size={size} className={className} />;
}
