import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const toneStyles = {
  orange: {
    iconBg: "bg-[var(--color-primary-soft)]",
    iconColor: "text-[var(--color-primary)]",
    valueColor: "text-[var(--color-primary)]",
  },
  green: {
    iconBg: "bg-[var(--color-success-soft)]",
    iconColor: "text-[var(--color-success)]",
    valueColor: "text-[var(--color-success)]",
  },
  blue: {
    iconBg: "bg-[var(--color-info-soft)]",
    iconColor: "text-[var(--color-info)]",
    valueColor: "text-[var(--color-info)]",
  },
  purple: {
    iconBg: "bg-[var(--color-purple-soft)]",
    iconColor: "text-[var(--color-purple)]",
    valueColor: "text-[var(--color-purple)]",
  },
  red: {
    iconBg: "bg-red-100",
    iconColor: "text-[var(--color-danger)]",
    valueColor: "text-[var(--color-danger)]",
  },
  yellow: {
    iconBg: "bg-[var(--color-warning-soft)]",
    iconColor: "text-[var(--color-warning)]",
    valueColor: "text-[var(--color-warning)]",
  },
} as const;

export type StatCardProps = {
  label: string;
  value: string | number;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof toneStyles;
  /** When true, value uses the tone color instead of heading. */
  coloredValue?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "orange",
  coloredValue = false,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
            styles.iconBg,
            styles.iconColor,
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight",
              coloredValue ? styles.valueColor : "text-[var(--color-heading)]",
            )}
          >
            {value}
          </p>
          {hint ? (
            <div className="mt-1 text-xs text-[var(--color-text-muted)]">
              {hint}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
