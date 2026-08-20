export const NOTIFICATION_CATEGORIES = [
  "updates",
  "reminders",
  "celebration",
  "announcement",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  createdAt: string;
  read?: boolean;
};

export type NotificationGlanceCounts = Record<NotificationCategory, number>;

export function isNotificationCategory(
  value: string | null | undefined,
): value is NotificationCategory {
  return (
    value === "updates" ||
    value === "reminders" ||
    value === "celebration" ||
    value === "announcement"
  );
}

export function countByCategory(
  items: NotificationItem[],
): NotificationGlanceCounts {
  const counts: NotificationGlanceCounts = {
    updates: 0,
    reminders: 0,
    celebration: 0,
    announcement: 0,
  };
  for (const item of items) {
    counts[item.category] += 1;
  }
  return counts;
}

export function unreadCount(items: NotificationItem[]): number {
  return items.filter((item) => !item.read).length;
}
