"use client";

import { Search, X } from "lucide-react";

import { Label, Skeleton } from "@/components/ui";
import type { MasterIdNameItem } from "@/features/masters/types";
import { cn } from "@/lib/utils/cn";

export type BrandsMultiSelectProps = {
  brands: MasterIdNameItem[];
  value: MasterIdNameItem[];
  onChange: (next: MasterIdNameItem[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
};

/** Split a comma-separated brandsRepresented string into trimmed names. */
export function parseBrandNames(raw: string): string[] {
  return String(raw ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Map saved brand names onto master list items; keep unmatched names as
 * synthetic chips so legacy data is not dropped.
 */
export function seedSelectedBrands(
  brandsRepresented: string,
  catalog: MasterIdNameItem[],
  brandIds?: number[],
): MasterIdNameItem[] {
  if (brandIds?.length) {
    const byId = new Map(
      catalog.map((item) => [String(item.id), item]),
    );
    const selected: MasterIdNameItem[] = [];
    const seen = new Set<string>();

    for (const id of brandIds) {
      const key = String(id);
      if (seen.has(key)) continue;
      seen.add(key);
      const match = byId.get(key);
      selected.push(match ?? { id: key, name: `Brand #${id}` });
    }
    return selected;
  }

  const names = parseBrandNames(brandsRepresented);
  if (names.length === 0) return [];

  const byName = new Map(
    catalog.map((item) => [item.name.trim().toLowerCase(), item]),
  );
  const selected: MasterIdNameItem[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const match = byName.get(key);
    if (match) {
      selected.push(match);
    } else {
      selected.push({ id: `legacy:${key}`, name });
    }
  }
  return selected;
}

export function BrandsMultiSelect({
  brands,
  value,
  onChange,
  query,
  onQueryChange,
  loading = false,
  disabled = false,
  error = null,
}: BrandsMultiSelectProps) {
  const selectedIds = new Set(value.map((b) => b.id));
  const selectedKeys = new Set(value.map((b) => b.name.trim().toLowerCase()));
  const normalizedQuery = query.trim().toLowerCase();

  const suggestions = brands.filter((brand) => {
    if (selectedIds.has(brand.id) || selectedKeys.has(brand.name.trim().toLowerCase())) {
      return false;
    }
    if (!normalizedQuery) return true;
    return brand.name.toLowerCase().includes(normalizedQuery);
  });

  function addBrand(brand: MasterIdNameItem) {
    if (disabled) return;
    if (
      selectedIds.has(brand.id) ||
      selectedKeys.has(brand.name.trim().toLowerCase())
    ) {
      return;
    }
    onChange([...value, brand]);
    onQueryChange("");
  }

  function removeBrand(brand: MasterIdNameItem) {
    if (disabled) return;
    onChange(value.filter((item) => item.id !== brand.id));
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <div>
        <Label required>Brands</Label>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Browse or search brands and tap a tag to add. Selected brands appear
          below.
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          disabled={disabled || loading}
          placeholder="Search & add brands..."
          onChange={(e) => onQueryChange(e.target.value)}
          className={cn(
            "h-10 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pr-3 pl-10 text-sm",
            "placeholder:text-[var(--color-text-muted)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          aria-label="Search brands"
        />
      </div>

      {loading ? (
        <div className="flex flex-wrap gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              {normalizedQuery ? "No brands found" : "All matching brands are selected"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => addBrand(brand)}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-3 text-sm font-medium text-[var(--color-primary)]",
                    "transition-colors hover:bg-[var(--color-primary)]/15",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    "disabled:pointer-events-none disabled:opacity-60",
                  )}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {value.map((brand) => (
            <span
              key={brand.id}
              className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2.5 text-sm font-medium text-[var(--color-heading)]"
            >
              <span className="min-w-0 truncate">{brand.name}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Remove ${brand.name}`}
                onClick={() => removeBrand(brand)}
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
          ))}
        </div>
      ) : null}
    </div>
  );
}
