"use client";

import { useState } from "react";
import type { ContentItem } from "@/types/branding";
import { PLATFORM_EMOJI, STATUS_LABEL, nextStatus } from "@/types/branding";
import { formatDate } from "@/lib/format";

const STATUS_STYLE: Record<ContentItem["status"], string> = {
  draft: "bg-surface-raised text-ink-muted",
  ready: "bg-accent-time/15 text-accent-time",
  posted: "bg-accent-branding/15 text-accent-branding",
};

export default function ContentCard({
  item,
  onCycleStatus,
  onDelete,
}: {
  item: ContentItem;
  onCycleStatus: (id: string, next: ContentItem["status"]) => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <button
        onClick={() => onCycleStatus(item.id, nextStatus(item.status))}
        aria-label="Ubah status"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg transition active:scale-90"
      >
        {PLATFORM_EMOJI[item.platform] ?? "✨"}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        <p className="truncate text-xs text-ink-muted">
          {item.platform} · {formatDate(item.postDate)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
        {confirming ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(item.id)} className="text-[11px] font-semibold text-red-500">
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
