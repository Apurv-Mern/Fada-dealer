"use client";

import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type DropdownMenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  contentClassName?: string;
};

function isMenuItemElement(
  child: React.ReactElement,
): child is React.ReactElement<{
  onSelect?: () => void;
  onClick?: () => void;
}> {
  const type = child.type;
  if (typeof type === "function" || typeof type === "object") {
    const name =
      (type as { displayName?: string; name?: string }).displayName ??
      (type as { name?: string }).name;
    if (name === "DropdownMenuLabel" || name === "DropdownMenuSeparator") {
      return false;
    }
  }
  const props = child.props as { onClick?: unknown; onSelect?: unknown };
  return (
    typeof props.onClick === "function" || typeof props.onSelect === "function"
  );
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
  contentClassName,
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
            contentClassName,
          )}
        >
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            if (!isMenuItemElement(child)) return child;
            const childOnSelect = child.props.onSelect;
            const childOnClick = child.props.onClick;
            return React.cloneElement(child, {
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
  disabled?: boolean;
  className?: string;
};

export function DropdownMenuItem({
  children,
  onClick,
  onSelect,
  destructive,
  disabled,
  className,
}: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-muted)]",
        destructive
          ? "text-[var(--color-danger)]"
          : "text-[var(--color-text)]",
        disabled && "pointer-events-none opacity-50",
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

export type DropdownMenuLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function DropdownMenuLabel({
  children,
  className,
}: DropdownMenuLabelProps) {
  return (
    <div
      className={cn(
        "px-3 py-2 text-sm text-[var(--color-text-muted)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export type DropdownMenuSeparatorProps = {
  className?: string;
};

export function DropdownMenuSeparator({
  className,
}: DropdownMenuSeparatorProps) {
  return (
    <div
      role="separator"
      className={cn("my-1 border-t border-[var(--color-border)]", className)}
    />
  );
}
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
