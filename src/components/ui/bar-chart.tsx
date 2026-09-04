import { cn } from "@/lib/utils/cn";

export type BarItem = {
  label: string;
  value: number;
  color: string;
};

export type BarChartProps = {
  items: BarItem[];
  max?: number;
  className?: string;
};

export function BarChart({ items, max, className }: BarChartProps) {
  const peak = max ?? Math.max(...items.map((item) => item.value), 1);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-48 items-end gap-4 sm:gap-6">
        {items.map((item) => {
          const height = `${Math.max(8, (item.value / peak) * 100)}%`;
          return (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                {item.value}
              </span>
              <div className="flex h-full w-full items-end justify-center">
                <div
                  className="w-full max-w-12 rounded-t-md"
                  style={{ height, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-4 sm:gap-6">
        {items.map((item) => (
          <p
            key={item.label}
            className="min-w-0 flex-1 break-words text-center text-xs leading-snug text-[var(--color-text-muted)] line-clamp-2"
          >
            {item.label}
          </p>
        ))}
      </div>
    </div>
  );
}
