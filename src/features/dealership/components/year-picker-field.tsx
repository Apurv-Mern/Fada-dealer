"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

const MIN_YEAR = 1900;
const YEARS_PER_PAGE = 12;

function yearsForDecade(startYear: number): number[] {
  const end = Math.max(startYear - (YEARS_PER_PAGE - 1), MIN_YEAR);
  const years: number[] = [];
  for (let y = startYear; y >= end; y -= 1) {
    years.push(y);
  }
  return years;
}

export function YearPickerField({
  label,
  value,
  onChange,
  className,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (year: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const parsed = Number.parseInt(value, 10);
  const selectedYear =
    Number.isFinite(parsed) && parsed >= MIN_YEAR && parsed <= currentYear
      ? parsed
      : null;

  const [open, setOpen] = useState(false);
  const [decadeEnd, setDecadeEnd] = useState(() =>
    selectedYear != null ? selectedYear : currentYear,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const inputId = useId();

  const years = useMemo(() => yearsForDecade(decadeEnd), [decadeEnd]);

  useEffect(() => {
    if (open && selectedYear != null) {
      setDecadeEnd(selectedYear);
    }
  }, [open, selectedYear]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function selectYear(year: number) {
    onChange(String(year));
    setOpen(false);
  }

  const canGoNext = decadeEnd < currentYear;
  const canGoPrev = decadeEnd - (YEARS_PER_PAGE - 1) > MIN_YEAR;
  const rangeStart = Math.max(decadeEnd - (YEARS_PER_PAGE - 1), MIN_YEAR);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div className="relative flex items-center">
        <input
          id={inputId}
          readOnly
          disabled={disabled}
          value={value}
          placeholder="Select year"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => !disabled && setOpen(true)}
          className={cn(
            "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 pr-9 text-sm text-[var(--color-text)]",
            "placeholder:text-[var(--color-text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:bg-[var(--color-muted)] disabled:opacity-60",
            "cursor-pointer",
          )}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label="Open year picker"
          className="absolute right-3 flex items-center text-[var(--color-text-muted)] disabled:opacity-60"
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <CalendarDays className="size-4" aria-hidden />
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Choose year"
          className="absolute left-0 z-30 mt-2 w-[min(100vw-2rem,16rem)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous years"
              disabled={!canGoPrev}
              className="inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-40"
              onClick={() =>
                setDecadeEnd((y) => Math.min(y + YEARS_PER_PAGE, currentYear))
              }
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="text-sm font-semibold text-[var(--color-heading)]">
              {rangeStart} – {decadeEnd}
            </span>
            <button
              type="button"
              aria-label="Next years"
              disabled={!canGoNext}
              className="inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-muted)] disabled:opacity-40"
              onClick={() =>
                setDecadeEnd((y) => Math.max(y - YEARS_PER_PAGE, MIN_YEAR))
              }
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className={cn(
                  "h-9 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
                  year === selectedYear
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-text)] hover:bg-[var(--color-muted)]",
                )}
                onClick={() => selectYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
