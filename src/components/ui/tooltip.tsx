"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

export type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

type Coords = { top: number; left: number };

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    setCoords({
      left: rect.left + rect.width / 2,
      top: side === "top" ? rect.top - gap : rect.bottom + gap,
    });
  }, [side]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  function show() {
    setOpen(true);
    requestAnimationFrame(updatePosition);
  }

  function hide() {
    setOpen(false);
    setCoords(null);
  }

  const tip =
    typeof document !== "undefined" && open && coords
      ? createPortal(
          <span
            id={tipId}
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-heading)] px-2 py-1 text-xs text-white shadow-sm",
              side === "top" ? "-translate-y-full" : undefined,
            )}
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
          </span>,
          document.body,
        )
      : null;

  return (
    <span
      ref={triggerRef}
      className={cn("inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {tip}
    </span>
  );
}
