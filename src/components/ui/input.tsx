import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  containerClassName?: string;
  inputSize?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-10 px-3 text-sm",
  lg: "h-11 px-3.5 text-base",
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      leftAddon,
      rightAddon,
      inputSize = "md",
      id,
      disabled,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        ) : null}

        <div className="relative flex items-center">
          {leftAddon ? (
            <span className="pointer-events-none absolute left-3 flex items-center text-[var(--color-text-muted)] [&_svg]:size-4">
              {leftAddon}
            </span>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text)]",
              "placeholder:text-[var(--color-text-muted)]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-60",
              sizeClasses[inputSize],
              hasError
                ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
                : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
              leftAddon && "pl-9",
              rightAddon && "pr-9",
              className,
            )}
            {...props}
          />

          {rightAddon ? (
            <span className="absolute right-3 flex items-center text-[var(--color-text-muted)] [&_svg]:size-4">
              {rightAddon}
            </span>
          ) : null}
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs text-[var(--color-danger)]"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="mt-1.5 text-xs text-[var(--color-text-muted)]"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
