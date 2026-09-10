"use client";

import { useState } from "react";
import type { Habit } from "@/types/kesehatan";

export default function HabitCard({
  habit,
  completed,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  completed: boolean;
  onToggle: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <button
        onClick={() => onToggle(habit.id, !completed)}
        aria-label="Toggle habit"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90 ${
          completed ? "border-accent-health bg-accent-health text-white" : "border-border text-transparent"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <p className={`flex-1 truncate text-sm font-semibold ${completed ? "text-ink-muted line-through" : "text-ink"}`}>
        {habit.name}
      </p>

      {confirming ? (
        <div className="flex gap-2">
          <button onClick={() => onDelete(habit.id)} className="text-[11px] font-semibold text-red-500">
            Hapus
          </button>
          <button onClick={() => setConfirming(false)} className="text-[11px] font-medium text-ink-muted">
            Batal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
        >
          Hapus
        </button>
      )}
    </div>
  );
}
