"use client";

import * as React from "react";

export function useRealtimeCollection<T>(
  userId: string | undefined,
  subscribe: (
    userId: string,
    cb: (items: T[]) => void,
    onError?: (e: Error) => void
  ) => () => void,
  fetchOnce?: (userId: string) => Promise<T[]>
) {
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local cache when the external subscription target disappears
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // The realtime listener below uses Firestore's streaming Listen channel,
    // which ad blockers and privacy extensions commonly flag as a tracking
    // beacon (net::ERR_BLOCKED_BY_CLIENT) since it looks like one. A one-time
    // read hits a different, non-streaming endpoint and isn't affected, so we
    // race it in to unblock the UI even when the live subscription can't connect.
    fetchOnce?.(userId)
      .then((items) => {
        if (!cancelled) {
          setData(items);
          setLoading(false);
        }
      })
      .catch(() => {
        // Swallow — the subscription below is still the primary source of truth.
      });

    const unsubscribe = subscribe(
      userId,
      (items) => {
        if (cancelled) return;
        setData(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        if (cancelled) return;
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { data, loading, error };
}
