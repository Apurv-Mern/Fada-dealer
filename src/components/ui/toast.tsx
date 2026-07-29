"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      toastOptions={{
        className:
          "font-[family-name:var(--font-geist-sans)] !border-[var(--color-border)] !bg-[var(--color-surface)] !text-[var(--color-text)] !shadow-[var(--shadow-card)]",
        classNames: {
          toast:
            "!border-[var(--color-border)] !bg-[var(--color-surface)] !text-[var(--color-text)]",
          title: "!font-semibold !text-[var(--color-heading)]",
          description: "!text-[var(--color-text-muted)]",
          success:
            "!border-[var(--color-success)]/30 !bg-[var(--color-success-soft)]",
          error:
            "!border-[var(--color-danger)]/30 !bg-[var(--color-surface)] [&_[data-title]]:!text-[var(--color-danger)]",
          closeButton:
            "!border-[var(--color-border)] !bg-[var(--color-surface)] !text-[var(--color-text-muted)]",
        },
      }}
    />
  );
}

export { toast } from "sonner";
