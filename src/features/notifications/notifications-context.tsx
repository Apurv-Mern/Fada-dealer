"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { getNotifications } from "@/features/notifications/api";
import type { NotificationItem } from "@/features/notifications/types";
import {
  countByCategory,
  unreadCount,
  type NotificationGlanceCounts,
} from "@/features/notifications/types";
import { useAsyncResource } from "@/lib/hooks/use-async-resource";

type NotificationsContextValue = {
  items: NotificationItem[];
  topFive: NotificationItem[];
  unreadCount: number;
  glanceCounts: NotificationGlanceCounts;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({
  actingDealerId,
  children,
}: {
  actingDealerId: string | null;
  children: ReactNode;
}) {
  const dealerKey = actingDealerId ?? "self";
  const loader = useCallback(() => getNotifications(), []);
  const { data, error, loading, retry } = useAsyncResource({
    key: `notifications|${dealerKey}`,
    loader,
    enabled: true,
  });

  const items = data ?? [];
  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      topFive: items.slice(0, 5),
      unreadCount: unreadCount(items),
      glanceCounts: countByCategory(items),
      loading: loading && !data,
      error,
      refresh: retry,
    }),
    [items, loading, data, error, retry],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      items: [],
      topFive: [],
      unreadCount: 0,
      glanceCounts: {
        updates: 0,
        reminders: 0,
        celebration: 0,
        announcement: 0,
      },
      loading: false,
      error: null,
      refresh: () => {},
    };
  }
  return ctx;
}
