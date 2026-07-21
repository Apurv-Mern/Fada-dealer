import { cn } from "@/lib/utils/cn";

export type ScoreBarProps = {
  score: number;
  max?: number;
  className?: string;
};

export function ScoreBar({ score, max = 1000, className }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <div className={cn("flex min-w-[120px] items-center gap-2", className)}>
      <span className="w-14 shrink-0 text-sm font-medium text-[var(--color-text)]">
        {score}/{max}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[var(--color-success)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
