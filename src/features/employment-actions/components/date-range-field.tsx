"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button, Input } from "@/components/ui";
import { formatDisplayDate } from "@/features/employment-actions/types";
import { cn } from "@/lib/utils/cn";

export function DateRangeField({
  from,
  to,
  onChange,
  className,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (open) {
      setDraftFrom(from);
      setDraftTo(to);
    }
  }, [open, from, to]);

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

  const label =
    from && to
      ? `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`
      : from
        ? `${formatDisplayDate(from)} - …`
        : to
          ? `… - ${formatDisplayDate(to)}`
          : "Date range";

  return (
    <div ref={rootRef} className={cn("relative min-w-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "inline-flex h-10 w-full min-w-[200px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-left text-sm text-[var(--color-text)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarDays
          className="size-4 shrink-0 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <span className="min-w-0 truncate">{label}</span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,20rem)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg"
        >
          <div className="space-y-3">
            <Input
              label="From"
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  let nextFrom = draftFrom;
                  let nextTo = draftTo;
                  if (nextFrom && nextTo && nextFrom > nextTo) {
                    [nextFrom, nextTo] = [nextTo, nextFrom];
                  }
                  onChange({ from: nextFrom, to: nextTo });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
