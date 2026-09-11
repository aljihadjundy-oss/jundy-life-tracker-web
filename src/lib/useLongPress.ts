"use client";

import { useCallback, useEffect, useRef } from "react";

const HOLD_MS = 450;
const MOVE_TOLERANCE = 10; // px — a scroll should never arm the press

/**
 * Press-and-hold handlers, the gesture photo galleries use to enter
 * multi-select. Returns props to spread on the row's container.
 */
export function useLongPress(onLongPress: () => void, enabled = true) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (!enabled) return;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        onLongPress();
        cancel();
      }, HOLD_MS);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const start = origin.current;
      if (!start) return;
      if (Math.abs(e.clientX - start.x) > MOVE_TOLERANCE || Math.abs(e.clientY - start.y) > MOVE_TOLERANCE) {
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
