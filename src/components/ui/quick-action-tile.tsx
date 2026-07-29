import type { LucideIcon } from "lucide-react";
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

export type QuickActionTileProps = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: keyof typeof toneStyles;
  className?: string;
};

export function QuickActionTile({
  label,
  icon: Icon,
  href,
  onClick,
  tone = "orange",
  className,
}: QuickActionTileProps) {
  const styles = toneStyles[tone];
  const content = (
    <>
      <span
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full",
          styles.iconBg,
          styles.iconColor,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-center text-xs font-semibold text-[var(--color-heading)]">
        {label}
      </span>
    </>
  );

  const classes = cn(
    "flex min-h-24 flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4 transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
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
