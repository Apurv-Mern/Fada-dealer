import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

const toneStyles = {
  orange: {
    iconBg: "bg-[var(--color-primary-soft)]",
    iconColor: "text-[var(--color-primary)]",
  },
  green: {
    iconBg: "bg-[var(--color-success-soft)]",
    iconColor: "text-[var(--color-success)]",
  },
  blue: {
    iconBg: "bg-[var(--color-info-soft)]",
    iconColor: "text-[var(--color-info)]",
  },
  purple: {
    iconBg: "bg-[var(--color-purple-soft)]",
    iconColor: "text-[var(--color-purple)]",
  },
  red: {
    iconBg: "bg-red-100",
    iconColor: "text-[var(--color-danger)]",
  },
} as const;

export type RequestMetricRowProps = {
  title: string;
  count: number | string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: keyof typeof toneStyles;
  className?: string;
};

export function RequestMetricRow({
  title,
  count,
  icon: Icon,
  href,
  onClick,
  tone = "blue",
  className,
}: RequestMetricRowProps) {
  const styles = toneStyles[tone];
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
          styles.iconBg,
          styles.iconColor,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-[var(--color-heading)]">
        {title}
      </span>
      <span className="text-sm font-semibold text-[var(--color-heading)]">
        {count}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-[var(--color-text-muted)]"
        aria-hidden
      />
    </>
  );

  const classes = cn(
    "flex h-12 w-full items-center gap-3 rounded-[var(--radius-md)] px-2 transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
