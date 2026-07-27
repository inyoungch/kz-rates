"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoRefresh(intervalMs: number, onRefresh?: () => void) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    setLastUpdated(new Date());
    const id = setInterval(() => {
      setLastUpdated(new Date());
      onRefreshRef.current?.();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const refresh = useCallback(() => {
    setLastUpdated(new Date());
    onRefreshRef.current?.();
  }, []);

  return { lastUpdated, refresh };
}
