import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-muted)] text-[var(--color-text)]",
        success:
          "bg-[var(--color-success-soft)] text-[var(--color-success)]",
        warning:
          "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
        danger: "bg-red-100 text-[var(--color-danger)]",
        info: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
        purple:
          "bg-[var(--color-purple-soft)] text-[var(--color-purple)]",
        orange:
          "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
        muted: "bg-slate-100 text-slate-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
