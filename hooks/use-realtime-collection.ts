"use client";

import * as React from "react";

export function useRealtimeCollection<T>(
  userId: string | undefined,
  subscribe: (
    userId: string,
    cb: (items: T[]) => void,
    onError?: (e: Error) => void
  ) => () => void
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

    setLoading(true);
    const unsubscribe = subscribe(
      userId,
      (items) => {
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { data, loading, error };
}
