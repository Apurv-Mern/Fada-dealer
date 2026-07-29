"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { cn } from "@/lib/utils/cn";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  title?: string;
  children: ReactNode;
  className?: string;
  /** Applied to the full-screen overlay root (e.g. `lg:hidden` for mobile nav). */
  overlayClassName?: string;
};

export function Sheet({
  open,
  onOpenChange,
  side = "left",
  title,
  children,
  className,
  overlayClassName,
}: SheetProps) {
  const panelRef = useFocusTrap(open, () => onOpenChange(false));

  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-50", overlayClassName)}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 flex w-[min(100%,320px)] flex-col bg-[var(--color-sidebar)] shadow-xl outline-none",
          side === "left" ? "left-0" : "right-0",
          className,
        )}
      >
        {title ? (
          <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
            <p className="text-sm font-semibold text-[var(--color-heading)]">
              {title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
            >
              <X />
            </Button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
