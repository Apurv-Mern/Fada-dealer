import { cn } from "@/lib/utils/cn";

export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

export type DonutChartProps = {
  title?: string;
  centerLabel?: string;
  centerValue: string | number;
  slices: DonutSlice[];
  className?: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArc,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export function DonutChart({
  centerLabel = "Total",
  centerValue,
  slices,
  className,
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const size = 160;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const arcs = slices.reduce<
    Array<DonutSlice & { start: number; end: number }>
  >((acc, slice) => {
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
    const end = start + (slice.value / total) * 360;
    return [...acc, { ...slice, start, end }];
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#eef2f7"
            strokeWidth={stroke}
          />
          {arcs.map((arc) => (
            <path
              key={arc.label}
              d={describeArc(cx, cy, radius, arc.start, arc.end - 0.4)}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-[var(--color-heading)]">
            {centerValue}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {slices.map((slice) => (
          <li
            key={slice.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2 text-[var(--color-text)]">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              {slice.label}
            </span>
            <span className="font-medium text-[var(--color-heading)]">
              {slice.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
