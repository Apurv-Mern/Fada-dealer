import { cn } from "@/lib/utils/cn";

export type ScoreBarProps = {
  score: number;
  max?: number;
  className?: string;
};

export function ScoreBar({ score, max = 1000, className }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <div className={cn("flex min-w-0 max-w-full items-center gap-1.5", className)}>
      <span className="shrink-0 text-xs font-medium whitespace-nowrap text-[var(--color-text)] tabular-nums">
        {score}/{max}
      </span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[var(--color-success)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
