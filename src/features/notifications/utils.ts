const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Relative label: Just now, 45m ago, Yesterday, 17 May */
export function formatRelativeTime(iso: string, now = new Date()): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return formatShortDate(date);

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const today = startOfLocalDay(now);
    const thatDay = startOfLocalDay(date);
    if (today.getTime() === thatDay.getTime()) {
      return hours === 1 ? "1h ago" : `${hours}h ago`;
    }
  }

  const today = startOfLocalDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thatDay = startOfLocalDay(date);
  if (thatDay.getTime() === yesterday.getTime()) return "Yesterday";

  return formatShortDate(date);
}

/** Absolute detail: Today, 09:20 AM */
export function formatNotificationTimestamp(
  iso: string,
  now = new Date(),
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const today = startOfLocalDay(now);
  const thatDay = startOfLocalDay(date);
  if (today.getTime() === thatDay.getTime()) return `Today, ${time}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (thatDay.getTime() === yesterday.getTime()) return `Yesterday, ${time}`;

  return `${formatShortDate(date)}, ${time}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function truncateDescription(text: string, max = 120): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function formatBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count > 9) return "9+";
  return String(count);
}
