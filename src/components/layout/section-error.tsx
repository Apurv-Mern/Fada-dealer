import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type SectionErrorProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
  icon?: LucideIcon;
  className?: string;
};

/** Embedded error for portal `<main>` only — keeps sidebar/header mounted. */
export function SectionError({
  title = "Couldn't load this section",
  description,
  onRetry,
  icon: Icon = AlertTriangle,
  className,
}: SectionErrorProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon className="size-6" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-heading)]">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
        {description}
      </p>
      {onRetry ? (
        <Button variant="primary" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
