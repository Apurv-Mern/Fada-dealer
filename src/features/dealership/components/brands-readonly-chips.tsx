"use client";

import { parseBrandNames } from "@/features/dealership/components/brands-multi-select";
import { ProfileFieldValue } from "@/features/dealership/components/profile-field-value";
import { displayValue } from "@/features/dealership/types";
import { cn } from "@/lib/utils/cn";

export function BrandsReadonlyChips({
  brandsRepresented,
  className,
  align = "start",
}: {
  brandsRepresented: string;
  className?: string;
  align?: "start" | "end";
}) {
  const names = parseBrandNames(brandsRepresented);

  if (names.length === 0) {
    return (
      <ProfileFieldValue
        value=""
        className={cn(align === "end" && "text-right", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        align === "end" && "justify-end",
        className,
      )}
    >
      {names.map((name) => (
        <span
          key={name.toLowerCase()}
          className="inline-flex h-8 max-w-full items-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 text-sm font-medium text-[var(--color-heading)]"
        >
          <span className="min-w-0 truncate">{displayValue(name)}</span>
        </span>
      ))}
    </div>
  );
}
