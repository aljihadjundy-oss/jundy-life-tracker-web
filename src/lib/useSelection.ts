"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Multi-select state shared by every module's list. Selection mode is entered
 * explicitly (a "Pilih" button or a long-press) rather than on the first tap,
 * so an ordinary tap keeps meaning "open this item".
 */
export function useSelection() {
  const [active, setActive] = useState(false);
  const [ids, setIds] = useState<string[]>([]);

  const selected = useMemo(() => new Set(ids), [ids]);

  const start = useCallback((id?: string) => {
    setActive(true);
    if (id) setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setIds([]);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const replace = useCallback((next: string[]) => setIds(next), []);

  return {
    active,
    /** Ids currently ticked, in tap order. */
    ids,
    count: ids.length,
    isSelected: (id: string) => selected.has(id),
    start,
    stop,
    toggle,
    replace,
  };
}

export type Selection = ReturnType<typeof useSelection>;
