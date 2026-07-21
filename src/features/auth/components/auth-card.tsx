import * as React from "react";

export type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md">
      {/* Mobile brand mark (brand panel is hidden on small screens) */}
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex size-9 items-center justify-center rounded-md bg-[var(--color-brand)] text-sm font-bold text-white">
          F
        </div>
        <p className="text-base font-bold tracking-wide text-[var(--color-brand)]">
          FADA <span className="text-[var(--color-primary)]">ID</span>
        </p>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-heading)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>

      {children}

      {footer ? (
        <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
