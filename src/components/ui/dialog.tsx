"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/utils/cn";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Rendered in the header before the close button (e.g. Download template). */
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Applied to the fixed overlay wrapper (e.g. z-[60] for stacked dialogs). */
  overlayClassName?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  headerActions,
  children,
  className,
  overlayClassName,
}: DialogProps) {
  const panelRef = useFocusTrap(open, () => onOpenChange(false));

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        overlayClassName,
      )}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-desc" : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[min(90dvh,40rem)] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] outline-none",
          className,
        )}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3 p-5 pb-0">
          <div className="min-w-0">
            {title ? (
              <h2
                id="dialog-title"
                className="text-lg font-semibold text-[var(--color-heading)]"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p
                id="dialog-desc"
                className="mt-1 text-sm text-[var(--color-text-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
