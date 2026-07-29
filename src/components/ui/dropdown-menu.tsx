"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type DropdownMenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {React.isValidElement(trigger)
          ? React.cloneElement(
              trigger as React.ReactElement<{ "aria-expanded"?: boolean }>,
              { "aria-expanded": open },
            )
          : trigger}
      </div>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full z-40 mt-1 min-w-[160px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-card)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            const existing = child as React.ReactElement<{
              onSelect?: () => void;
              onClick?: () => void;
            }>;
            const childOnSelect = existing.props.onSelect;
            const childOnClick = existing.props.onClick;
            return React.cloneElement(existing, {
              onSelect: () => {
                childOnSelect?.();
                setOpen(false);
              },
              onClick: () => {
                childOnClick?.();
              },
            });
          })}
        </div>
      ) : null}
    </div>
  );
}

export type DropdownMenuItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
  onSelect?: () => void;
  destructive?: boolean;
  className?: string;
};

export function DropdownMenuItem({
  children,
  onClick,
  onSelect,
  destructive,
  className,
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-muted)]",
        destructive
          ? "text-[var(--color-danger)]"
          : "text-[var(--color-text)]",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
        onSelect?.();
      }}
    >
      {children}
    </button>
  );
}
