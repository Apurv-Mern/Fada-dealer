import { getAnnouncements } from "@/features/announcements/api";
import { isMockMode } from "@/lib/api";
import { mockDelay } from "@/lib/api/parse";
import { mockNotifications } from "@/features/notifications/mocks/data";
import type { NotificationItem } from "@/features/notifications/types";
import { truncateDescription } from "@/features/notifications/utils";

export async function getNotifications(): Promise<NotificationItem[]> {
  if (isMockMode()) {
    await mockDelay(150);
    return mockNotifications
      .map((row) => ({ ...row }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  try {
    const announcements = await getAnnouncements();
    return announcements
      .map((ann) => ({
        id: ann.id,
        title: ann.title,
        description: truncateDescription(ann.messageBody || ann.title),
        category: "announcement" as const,
        createdAt: ann.publishedAt || ann.createdAt,
        read: false,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch {
    return [];
  }
}
