import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: React.ReactNode;
  error?: string;
  containerClassName?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, containerClassName, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className={cn("w-full", containerClassName)}>
        <label
          htmlFor={checkboxId}
          className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--color-text)]"
        >
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded border-[var(--color-border)] text-[var(--color-primary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
              className,
            )}
            {...props}
          />
          {label ? <span className="leading-snug">{label}</span> : null}
        </label>
        {error ? (
          <p role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
