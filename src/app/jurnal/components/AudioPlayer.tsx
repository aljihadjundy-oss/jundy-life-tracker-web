"use client";

import { useEffect, useState } from "react";
import { getClip } from "@/lib/audio-store";
import { useT } from "@/lib/i18n";

/**
 * Plays back a clip from IndexedDB. It resolves to "not on this device" rather
 * than an error when the entry was recorded somewhere else — that is the
 * expected case, not a failure.
 */
export default function AudioPlayer({
  entryId,
  seconds,
  onDelete,
}: {
  entryId: string;
  seconds: number;
  onDelete?: () => void;
}) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    getClip(entryId).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setMissing(true);
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entryId]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl bg-surface-raised p-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">🎙️</span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
          {t("journal.voiceNote")} · {mmss}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="shrink-0 text-[11px] font-semibold text-red-500"
          >
            {t("app.delete")}
          </button>
        )}
      </div>

      {url ? (
        <audio controls src={url} className="w-full" preload="metadata" />
      ) : (
        <p className="text-[11px] text-ink-muted">
          {missing ? t("journal.clipNotOnDevice") : t("app.loading")}
        </p>
      )}
    </div>
  );
}
