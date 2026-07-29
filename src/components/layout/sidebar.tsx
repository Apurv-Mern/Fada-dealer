"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

import { dealerNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

export type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-sidebar)]",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-[var(--color-border)] px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-[var(--color-brand)] text-xs font-bold text-white">
          F
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide text-[var(--color-brand)]">
            FADA <span className="text-[var(--color-primary)]">ID</span>
          </p>
          <p className="text-[10px] font-medium tracking-wider text-[var(--color-text-muted)] uppercase">
            Dealer Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {dealerNavItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-text)]",
              )}
            >
              {active ? (
                <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r bg-[var(--color-primary)]" />
              ) : null}
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
          <Phone className="size-4 text-[var(--color-primary)]" aria-hidden />
          Need Help?
        </div>
        <p className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
          Reach FADA support for onboarding and employment issues.
        </p>
        <a
          href="mailto:support@fada.in"
          className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          Contact FADA Support
        </a>
      </div>
    </aside>
  );
}
