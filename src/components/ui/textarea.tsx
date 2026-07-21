import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      helperText,
      error,
      id,
      disabled,
      required,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const helperId = `${textareaId}-helper`;
    const errorId = `${textareaId}-error`;
    const hasError = Boolean(error);

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          rows={rows}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full resize-y rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]",
            "placeholder:text-[var(--color-text-muted)]",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-60",
            hasError
              ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
              : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            className,
          )}
          {...props}
        />

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

Textarea.displayName = "Textarea";
