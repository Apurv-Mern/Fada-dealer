"use client";

import { useCallback, useEffect, useState } from "react";

import {
  isUnauthorizedError,
  messageFromApiError,
} from "@/lib/api/errors";

export type AsyncResourceState<T> = {
  data: T | null;
  error: string | null;
  /** True when there is no data yet (first load / after clear). */
  loading: boolean;
  /** True when refetching while previous data may still be shown. */
  isRefreshing: boolean;
  retry: () => void;
};

type Snapshot<T> = {
  forKey: string;
  data: T | null;
  error: string | null;
};

/**
 * Cancelable async load keyed by `key`. When `key` changes, reloads.
 * 401s are ignored (forceLocalLogout handles redirect).
 */
export function useAsyncResource<T>(options: {
  key: string;
  loader: () => Promise<T>;
  enabled?: boolean;
}): AsyncResourceState<T> {
  const { key, loader, enabled = true } = options;
  const [retryKey, setRetryKey] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    forKey: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const requestKey = `${key}#${retryKey}`;

    (async () => {
      try {
        const next = await loader();
        if (cancelled) return;
        setSnapshot({ forKey: requestKey, data: next, error: null });
      } catch (err) {
        if (cancelled || isUnauthorizedError(err)) return;
        setSnapshot({
          forKey: requestKey,
          data: null,
          error: messageFromApiError(err),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [key, retryKey, enabled, loader]);

  const retry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const requestKey = `${key}#${retryKey}`;
  const settled = snapshot.forKey === requestKey;
  const loading = enabled && !settled && snapshot.data === null;
  const isRefreshing = enabled && !settled && snapshot.data !== null;

  return {
    data: snapshot.data,
    error: settled ? snapshot.error : null,
    loading,
    isRefreshing,
    retry,
  };
}
