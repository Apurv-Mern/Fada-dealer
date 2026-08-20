"use client";

import {
  PROFILE_EMPTY_MARKER,
  displayProfileField,
  isProfileFieldEmpty,
} from "@/features/dealership/types";
import { cn } from "@/lib/utils/cn";

export function ProfileFieldValue({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  const text = displayProfileField(value);
  const empty = isProfileFieldEmpty(value);

  return (
    <span
      className={cn(
        empty && "tracking-widest text-[var(--color-text-muted)]",
        className,
      )}
      aria-label={empty ? "Not provided" : undefined}
    >
      {empty ? PROFILE_EMPTY_MARKER : text}
    </span>
  );
}
