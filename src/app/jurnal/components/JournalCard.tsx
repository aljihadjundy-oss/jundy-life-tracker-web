"use client";

import { useState } from "react";
import type { JournalEntry } from "@/types/journal";
import { formatDate } from "@/lib/format";

export default function JournalCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: JournalEntry;
  onOpen: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const preview = entry.content.replace(/\s+/g, " ").trim().slice(0, 90);

  return (
    <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <button onClick={() => onOpen(entry)} className="block w-full text-left">
        <div className="flex items-start gap-3">
          {entry.mood && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg">
              {entry.mood}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{entry.title || "Tanpa judul"}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{formatDate(entry.date)}</p>
            {preview && <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted">{preview}</p>}
          </div>
        </div>
      </button>

      <div className="mt-2 flex justify-end">
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(entry.id)} className="text-[11px] font-semibold text-red-500">
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
    </div>
  );
}
