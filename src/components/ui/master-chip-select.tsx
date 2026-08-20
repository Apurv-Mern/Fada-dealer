"use client";

import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectOption } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

export type MasterChipItem = { id: string; name: string };

export function toChipItems(options: SelectOption[]): MasterChipItem[] {
  return options.map((option) => ({ id: option.value, name: option.label }));
}

export function filterChipItems(
  items: MasterChipItem[],
  query: string,
): MasterChipItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    item.name.toLowerCase().includes(normalized),
  );
}

export function buildVisibleChipItems(
  filtered: MasterChipItem[],
  selectedId: string,
  previewLimit: number,
  query: string,
): MasterChipItem[] {
  const hasQuery = query.trim().length > 0;
  if (hasQuery || filtered.length <= previewLimit) {
    return filtered;
  }

  const selected = filtered.find((item) => item.id === selectedId);
  const rest = filtered
    .filter((item) => item.id !== selectedId)
    .sort((a, b) => a.name.localeCompare(b.name));

  const visible: MasterChipItem[] = [];
  if (selected) visible.push(selected);

  for (const item of rest) {
    if (visible.length >= previewLimit) break;
    visible.push(item);
  }

  return visible;
}

export function getChipPreviewHint(
  filteredCount: number,
  previewLimit: number,
  query: string,
): string | null {
  const hasQuery = query.trim().length > 0;
  if (hasQuery || filteredCount <= previewLimit) return null;
  return `Showing ${previewLimit} of ${filteredCount}. Search to find more.`;
}

export type MasterChipSelectProps = {
  items: MasterChipItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  searchAriaLabel: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  previewLimit?: number;
  compact?: boolean;
  className?: string;
};

export function MasterChipSelect({
  items,
  value,
  onChange,
  label,
  hint,
  placeholder = "Search…",
  searchAriaLabel,
  id,
  required,
  disabled,
  loading,
  error,
  previewLimit = 5,
  compact = false,
  className,
}: MasterChipSelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();

  const filtered = useMemo(
    () => filterChipItems(items, query),
    [items, query],
  );

  const visibleItems = useMemo(
    () => buildVisibleChipItems(filtered, value, previewLimit, query),
    [filtered, value, previewLimit, query],
  );

  const previewHint = getChipPreviewHint(filtered.length, previewLimit, query);
  const selected = items.find((item) => item.id === value);

  const panelMessage = (() => {
    if (loading) return null;
    if (filtered.length > 0) return null;
    if (normalizedQuery) {
      return `No results for “${normalizedQuery}”`;
    }
    return "No options available";
  })();

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      {label ? (
        <div>
          <Label htmlFor={fieldId} required={required}>
            {label}
          </Label>
          {hint ? (
            <p
              className={cn(
                "text-[var(--color-text-muted)]",
                compact ? "mt-0.5 text-xs" : "mt-1 text-xs",
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <input
          id={fieldId}
          type="search"
          disabled={disabled || loading}
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "h-10 w-full min-w-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-10 text-sm",
            "placeholder:text-[var(--color-text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label={searchAriaLabel}
        />
      </div>

      <div
        className="max-h-40 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        role="listbox"
        aria-label={label ?? searchAriaLabel}
        aria-live="polite"
      >
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        ) : panelMessage ? (
          <p className="text-sm text-[var(--color-text-muted)]">{panelMessage}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleItems.map((item) => {
              const isSelected = item.id === value;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(item.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    "disabled:pointer-events-none disabled:opacity-60",
                    isSelected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15",
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        )}

        {previewHint && !loading ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {previewHint}
          </p>
        ) : null}
      </div>

      {selected ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 text-sm font-medium text-[var(--color-heading)]">
            <span className="min-w-0 truncate">{selected.name}</span>
            <button
              type="button"
              disabled={disabled || loading}
              aria-label={`Clear ${selected.name}`}
              onClick={() => onChange("")}
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)]",
                "hover:bg-white hover:text-[var(--color-text)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
