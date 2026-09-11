"use client";

import { useState } from "react";
import type { ContentItem } from "@/types/branding";
import { PLATFORM_EMOJI, nextStatus } from "@/types/branding";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import SelectCheckbox from "@/components/SelectCheckbox";
import { useLongPress } from "@/lib/useLongPress";

const STATUS_STYLE: Record<ContentItem["status"], string> = {
  draft: "bg-surface-raised text-ink-muted",
  ready: "bg-accent-time/15 text-accent-time",
  posted: "bg-accent-branding/15 text-accent-branding",
};

export default function ContentCard({
  item,
  onCycleStatus,
  onDelete,
  selectMode,
  selected,
  onToggleSelect,
  onLongPress,
}: {
  item: ContentItem;
  onCycleStatus: (id: string, next: ContentItem["status"]) => void;
  onDelete: (id: string) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const longPress = useLongPress(() => onLongPress(item.id), !selectMode);

  return (
    <div
      {...longPress}
      onClick={() => selectMode && onToggleSelect(item.id)}
      className={`flex items-center gap-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 transition ${
        selected ? "ring-2 ring-accent-branding" : "ring-border/60"
      }`}
    >
      {selectMode ? (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <SelectCheckbox checked={selected} />
        </div>
      ) : (
        <button
          onClick={() => onCycleStatus(item.id, nextStatus(item.status))}
          aria-label={t("time.changeStatus")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-lg transition active:scale-90"
        >
          {PLATFORM_EMOJI[item.platform] ?? "✨"}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        <p className="truncate text-xs text-ink-muted">
          {item.platform} · {formatDate(item.postDate)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[item.status]}`}>
          {t(`contentStatus.${item.status}`)}
        </span>
        {selectMode ? null : confirming ? (
          <div className="flex gap-2">
            <button onClick={() => onDelete(item.id)} className="text-[11px] font-semibold text-red-500">
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
