"use client";

import type {
  EmploymentRequestTypeCounts,
  EmploymentRequestTypeFilter,
} from "@/features/employment-requests/types";
import { cn } from "@/lib/utils/cn";

const TABS: {
  value: EmploymentRequestTypeFilter;
  label: string;
  countKey: keyof EmploymentRequestTypeCounts;
}[] = [
  { value: "", label: "All Requests", countKey: "all" },
  { value: "Join", label: "Join Requests", countKey: "join" },
  { value: "Exit", label: "Exit Requests", countKey: "exit" },
];

export function EmploymentRequestsTabs({
  value,
  counts,
  onChange,
}: {
  value: EmploymentRequestTypeFilter;
  counts: EmploymentRequestTypeCounts;
  onChange: (next: EmploymentRequestTypeFilter) => void;
}) {
  return (
    <div
      className="-mx-1 mb-6 overflow-x-auto px-1"
      role="tablist"
      aria-label="Request type"
    >
      <div className="flex min-w-max gap-1 border-b border-[var(--color-border)]">
        {TABS.map((tab) => {
          const selected = value === tab.value;
          const count = counts[tab.countKey] ?? 0;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
                selected
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-heading)]",
              )}
              onClick={() => onChange(tab.value)}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  selected
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                ({count})
              </span>
              {selected ? (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--color-primary)]"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
