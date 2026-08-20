"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  autoFocus?: boolean;
  containerClassName?: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function OtpInput({
  value,
  onChange,
  length = 4,
  label,
  helperText,
  error,
  required,
  disabled,
  id,
  autoFocus,
  containerClassName,
}: OtpInputProps) {
  const generatedId = React.useId();
  const groupId = id ?? generatedId;
  const errorId = `${groupId}-error`;
  const helperId = `${groupId}-helper`;
  const hasError = Boolean(error);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const digits = React.useMemo(() => {
    const normalized = digitsOnly(value).slice(0, length);
    return Array.from({ length }, (_, index) => normalized[index] ?? "");
  }, [length, value]);

  React.useEffect(() => {
    if (!autoFocus || disabled) return;
    inputRefs.current[0]?.focus();
  }, [autoFocus, disabled]);

  function focusSlot(index: number) {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
  }

  function updateValue(nextDigits: string[]) {
    onChange(nextDigits.join("").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const incoming = digitsOnly(raw);
    if (!incoming) {
      const next = [...digits];
      next[index] = "";
      updateValue(next);
      return;
    }

    const next = [...digits];

    if (incoming.length > 1) {
      for (let i = 0; i < incoming.length && index + i < length; i += 1) {
        next[index + i] = incoming[i] ?? "";
      }
      updateValue(next);
      focusSlot(index + incoming.length);
      return;
    }

    next[index] = incoming;
    updateValue(next);
    if (index < length - 1) {
      focusSlot(index + 1);
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        updateValue(next);
        return;
      }

      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        updateValue(next);
        focusSlot(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusSlot(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusSlot(index + 1);
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text"));
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < pasted.length && index + i < length; i += 1) {
      next[index + i] = pasted[i] ?? "";
    }
    updateValue(next);
    focusSlot(Math.min(index + pasted.length, length - 1));
  }

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <Label htmlFor={`${groupId}-0`} required={required}>
          {label}
        </Label>
      ) : null}

      <div
        role="group"
        aria-label={label ?? "One-time password"}
        aria-invalid={hasError || undefined}
        aria-describedby={
          hasError ? errorId : helperText ? helperId : undefined
        }
        className="grid max-w-[16.5rem] grid-cols-4 gap-2 sm:gap-2.5"
      >
        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;

          return (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            id={`${groupId}-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${length}`}
            value={digit}
            disabled={disabled}
            required={required}
            maxLength={1}
            className={cn(
              "size-11 rounded-[var(--radius-md)] border p-0 text-center text-base font-semibold tabular-nums text-[var(--color-text)] sm:size-12 sm:text-lg",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-60",
              hasError
                ? "border-[var(--color-danger)] bg-[var(--color-surface)] focus:ring-[var(--color-danger)]/15"
                : digit
                  ? "border-[var(--color-primary)]/35 bg-[var(--color-primary-soft)]"
                  : "border-[var(--color-border-strong)] bg-[var(--color-surface)]",
              isFocused &&
                !hasError &&
                "border-[var(--color-primary)] shadow-[0_0_0_2px_rgba(232,93,4,0.12)]",
            )}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => {
              setFocusedIndex(index);
              event.target.select();
            }}
            onBlur={() => {
              setFocusedIndex((current) => (current === index ? null : current));
            }}
          />
          );
        })}
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-left text-xs text-[var(--color-danger)]"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className="mt-1.5 text-left text-xs text-[var(--color-text-muted)]"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
