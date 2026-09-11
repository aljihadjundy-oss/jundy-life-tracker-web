"use client";

import { useState } from "react";
import type { JournalEntry } from "@/types/journal";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

export default function JournalCard({
  entry,
  onOpen,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  entry: JournalEntry;
  onOpen: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const longPress = useLongPress(() => onLongPress(entry.id), !selectMode);
  const preview = entry.content.replace(/\s+/g, " ").trim().slice(0, 90);

  return (
    <div
      {...longPress}
      className={`rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-brand-start" : "ring-border/60"
      }`}
    >
      <button
        onClick={() => (selectMode ? onToggleSelect(entry.id) : onOpen(entry))}
        className="block w-full text-left"
      >
        <div className="flex items-start gap-3">
          {selectMode && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <SelectCheckbox checked={selected} />
            </div>
          )}
          {!selectMode && entry.mood && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg">
              {entry.mood}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{entry.title || t("journal.untitled")}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{formatDate(entry.date)}</p>
            {preview && <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted">{preview}</p>}
          </div>
        </div>
      </button>

      <div className={`mt-2 flex justify-end ${selectMode ? "hidden" : ""}`}>
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(entry.id)} className="text-[11px] font-semibold text-red-500">
              {t("app.delete")}
            </button>
            <button onClick={() => setConfirming(false)} className="text-[11px] font-medium text-ink-muted">
              {t("app.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
          >
            {t("app.delete")}
          </button>
        )}
      </div>
    </div>
  );
}
