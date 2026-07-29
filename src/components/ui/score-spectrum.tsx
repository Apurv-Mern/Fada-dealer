import { cn } from "@/lib/utils/cn";

export type ScoreSpectrumProps = {
  /** 0–100 position of the marker; omit or null hides the marker. */
  value?: number | null;
  markerLabel?: string;
  className?: string;
};

export function ScoreSpectrum({
  value,
  markerLabel = "Dealership average",
  className,
}: ScoreSpectrumProps) {
  const hasMarker =
    typeof value === "number" && Number.isFinite(value) && value >= 0;
  const pct = hasMarker ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {hasMarker ? (
        <div className="relative h-5">
          <span
            className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-[var(--color-text-muted)]"
            style={{ left: `${pct}%` }}
          >
            {markerLabel}
          </span>
        </div>
      ) : null}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-danger) 0%, var(--color-warning) 45%, var(--color-success) 100%)",
          }}
        />
        {hasMarker ? (
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-heading)] shadow-sm"
            style={{ left: `${pct}%` }}
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
