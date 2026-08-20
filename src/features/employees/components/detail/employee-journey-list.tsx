"use client";

import { ExternalLink } from "lucide-react";

import type { EmployeeJourneyItem } from "@/features/employees/types";

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EmployeeJourneyList({
  items,
  emptyLabel = "None yet",
}: {
  items: EmployeeJourneyItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-[var(--color-text-muted)]">{emptyLabel}</p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const dateLabel = formatDate(item.date);
        return (
          <li key={item.id} className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-heading)]">
              {item.title}
            </p>
            {item.meta ? (
              <p className="text-xs text-[var(--color-text-muted)]">{item.meta}</p>
            ) : null}
            {dateLabel ? (
              <p className="text-xs text-[var(--color-text-muted)]">{dateLabel}</p>
            ) : null}
            {item.description ? (
              <p className="mt-0.5 text-xs text-[var(--color-text)]">
                {item.description}
              </p>
            ) : null}
            {item.attachmentUrl ? (
              <a
                href={item.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                View attachment
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
