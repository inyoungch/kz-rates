"use client";

import { useEffect, useState } from "react";

/**
 * Returns null on the very first render (server + pre-hydration client) so
 * SSR output and initial client output match, then starts ticking after mount.
 */
export function useNow(intervalMs: number): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
