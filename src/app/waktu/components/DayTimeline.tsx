"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Task } from "@/types/waktu";
import { isTimed, TASK_COLOR } from "@/types/waktu";
import { addMinutesToHHmm, formatTime, minutesFromHHmm, nowHHmm, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

const HOUR_HEIGHT = 56; // px per hour — one finger-width per hour reads well on a phone
const MIN_BLOCK_HEIGHT = 26;

type Placed = { task: Task; top: number; height: number; column: number; columns: number };

/**
 * Gives every overlapping run of tasks its own set of side-by-side columns, the
 * way Google Calendar does. Tasks arrive already sorted by start time.
 */
function place(tasks: Task[]): Placed[] {
  const timed = tasks.filter(isTimed);
  const placed: Placed[] = [];

  let cluster: Placed[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const item of cluster) item.columns = cluster.reduce((max, i) => Math.max(max, i.column + 1), 1);
    placed.push(...cluster);
    cluster = [];
    clusterEnd = -1;
  };

  for (const task of timed) {
    const start = minutesFromHHmm(task.startTime);
    const end = start + Math.max(15, task.durationMinutes);

    if (cluster.length > 0 && start >= clusterEnd) flush();

    // Reuse the left-most column whose last task has already finished.
    const columnEnds = new Map<number, number>();
    for (const item of cluster) {
      const itemEnd = minutesFromHHmm(item.task.startTime) + Math.max(15, item.task.durationMinutes);
      columnEnds.set(item.column, Math.max(columnEnds.get(item.column) ?? 0, itemEnd));
    }
    let column = 0;
    while ((columnEnds.get(column) ?? 0) > start) column++;

    cluster.push({
      task,
      top: (start / 60) * HOUR_HEIGHT,
      height: Math.max(MIN_BLOCK_HEIGHT, ((end - start) / 60) * HOUR_HEIGHT),
      column,
      columns: 1,
    });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length > 0) flush();

  return placed;
}

export default function DayTimeline({
  date,
  tasks,
  onSelectTask,
  onCreateAt,
}: {
  date: string;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onCreateAt: (startTime: string) => void;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isToday = date === todayISO();

  const allDay = useMemo(() => tasks.filter((task) => !isTimed(task)), [tasks]);
  const blocks = useMemo(() => place(tasks), [tasks]);

  // Open the day where something is actually happening rather than at midnight.
  const firstStart = blocks.length > 0 ? minutesFromHHmm(blocks[0].task.startTime) : null;
  const anchorMinutes = firstStart ?? (isToday ? minutesFromHHmm(nowHHmm()) : 8 * 60);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, (anchorMinutes / 60) * HOUR_HEIGHT - HOUR_HEIGHT);
  }, [anchorMinutes, date]);

  const nowOffset = isToday ? (minutesFromHHmm(nowHHmm()) / 60) * HOUR_HEIGHT : null;

  return (
    <div className="mx-5 overflow-hidden rounded-2xl bg-surface-card ring-1 ring-border/60">
      {allDay.length > 0 && (
        <div className="border-b border-border/60 px-3 py-2">
          <span className="block pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
            {t("time.allDay")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {allDay.map((task) => (
              <button
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="max-w-full truncate rounded-lg px-2 py-1 text-[11px] font-semibold text-white"
                style={{ background: TASK_COLOR[task.status] }}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="no-scrollbar relative max-h-[60vh] overflow-y-auto">
        <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <button
              key={hour}
              type="button"
              onClick={() => onCreateAt(`${String(hour).padStart(2, "0")}:00`)}
              aria-label={t("time.addAt", { time: formatTime(`${String(hour).padStart(2, "0")}:00`) })}
              className="absolute left-0 right-0 flex items-start border-t border-border/50 text-left"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <span className="w-12 shrink-0 -translate-y-1.5 pl-2 text-[10px] font-medium tabular-nums text-ink-muted">
                {hour === 0 ? "" : formatTime(`${String(hour).padStart(2, "0")}:00`)}
              </span>
            </button>
          ))}

          {blocks.map(({ task, top, height, column, columns }) => {
            const width = `calc((100% - 3.25rem) / ${columns})`;
            return (
              <button
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="absolute overflow-hidden rounded-lg px-2 py-1 text-left ring-1 ring-white/25 transition active:scale-[0.98]"
                style={{
                  top,
                  height,
                  left: `calc(3rem + ${column} * ${width})`,
                  width: `calc(${width} - 0.25rem)`,
                  background: TASK_COLOR[task.status],
                  opacity: task.status === "done" ? 0.55 : 1,
                }}
              >
                <p
                  className={`truncate text-[11px] font-bold leading-tight text-white ${
                    task.status === "done" ? "line-through" : ""
                  }`}
                >
                  {task.title}
                </p>
                {height >= 40 && (
                  <p className="truncate text-[10px] leading-tight text-white/85">
                    {formatTime(task.startTime)} –{" "}
                    {formatTime(addMinutesToHHmm(task.startTime, task.durationMinutes))}
                  </p>
                )}
              </button>
            );
          })}

          {nowOffset !== null && (
            <div
              className="pointer-events-none absolute left-10 right-0 flex items-center"
              style={{ top: nowOffset }}
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="h-px flex-1 bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
