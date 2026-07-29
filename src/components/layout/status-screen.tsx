import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type StatusAction = {
  label: string;
} & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

export type StatusScreenProps = {
  code?: string | number;
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: StatusAction;
  secondaryAction?: StatusAction;
  className?: string;
};

function FadaMark() {
  return (
    <div className="mb-10 flex items-center gap-2">
      <div className="flex size-9 items-center justify-center rounded-md bg-[var(--color-brand)] text-sm font-bold text-white">
        F
      </div>
      <p className="text-base font-bold tracking-wide text-[var(--color-brand)]">
        FADA <span className="text-[var(--color-primary)]">ID</span>
      </p>
    </div>
  );
}

export function StatusScreen({
  code,
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: StatusScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-[var(--background)] px-6 py-12",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
        <FadaMark />

        {code != null ? (
          <p
            className="mb-3 text-5xl font-bold tracking-tight text-[var(--color-brand)]/15 sm:text-6xl"
            aria-hidden
          >
            {code}
          </p>
        ) : null}

        {Icon ? (
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Icon className="size-6" aria-hidden />
          </div>
        ) : null}

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-heading)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        ) : null}

        {primaryAction || secondaryAction ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {primaryAction ? (
              primaryAction.href ? (
                <Link
                  href={primaryAction.href}
                  className={cn(buttonVariants({ variant: "primary" }))}
                >
                  {primaryAction.label}
                </Link>
              ) : (
                <Button variant="primary" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )
            ) : null}
            {secondaryAction ? (
              secondaryAction.href ? (
                <Link
                  href={secondaryAction.href}
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  {secondaryAction.label}
                </Link>
              ) : (
                <Button variant="outline" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
