"use client";

import { useEffect, useState } from "react";
import {
  fetchChannelStats,
  formatCount,
  hasYouTubeKey,
  setYouTubeChannel,
  subscribeYouTubeChannel,
  type YouTubeStats,
} from "@/lib/youtube";
import { useT } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

export default function YouTubeCard({ uid }: { uid: string }) {
  const t = useT();
  const [channel, setChannel] = useState<string | null>(null);
  // One result slot instead of separate loading/error/data flags: null means
  // "still fetching", which keeps the effect free of synchronous state writes.
  const [result, setResult] = useState<{ stats?: YouTubeStats; error?: string } | null>(null);
  const [input, setInput] = useState("");

  useEffect(() => subscribeYouTubeChannel(uid, setChannel), [uid]);

  useEffect(() => {
    if (!channel || !hasYouTubeKey()) return;
    let active = true;
    fetchChannelStats(channel)
      .then((stats) => {
        if (active) setResult({ stats });
      })
      .catch((err: Error) => {
        if (active) setResult({ error: err.message });
      });
    return () => {
      active = false;
    };
  }, [channel]);

  const loading = result === null;
  const stats = result?.stats ?? null;
  const error = result?.error ?? null;

  if (!hasYouTubeKey()) {
    return (
      <Shell>
        <p className="text-xs text-ink-muted">{t("youtube.noKey")}</p>
      </Shell>
    );
  }

  if (channel === null) return null;

  if (!channel) {
    return (
      <Shell>
        <p className="mb-3 text-xs text-ink-muted">{t("youtube.connectHint")}</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="@channel"
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
          <button
            onClick={() => input.trim() && setYouTubeChannel(uid, input.trim())}
            className="shrink-0 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
          >
            {t("youtube.connect")}
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {loading && <p className="text-xs text-ink-muted">{t("app.loading")}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {stats && !loading && (
        <>
          <div className="flex items-center gap-3">
            {stats.avatar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stats.avatar} alt="" className="h-10 w-10 rounded-full" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{stats.title}</p>
              <p className="text-[11px] text-ink-muted">
                {t("youtube.videoCount", { count: stats.videoCount })}
              </p>
            </div>
            <button
              onClick={() => setYouTubeChannel(uid, "")}
              className="shrink-0 text-[11px] font-medium text-ink-muted underline-offset-2 hover:underline"
            >
              {t("youtube.disconnect")}
            </button>
          </div>

          <div className="mt-3 flex gap-2.5">
            <Stat label={t("youtube.subscribers")} value={formatCount(stats.subscribers)} />
            <Stat label={t("youtube.views")} value={formatCount(stats.views)} />
          </div>

          {stats.recent.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {stats.recent.map((video) => (
                <a
                  key={video.id}
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-surface-raised p-2 transition active:scale-[0.98]"
                >
                  {video.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnail} alt="" className="h-9 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-ink">{video.title}</p>
                    <p className="text-[10px] text-ink-muted">
                      {formatDate(video.publishedAt.slice(0, 10))}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="mx-5 mt-3 rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
        <span>▶️</span> {t("youtube.title")}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-xl bg-surface-raised p-2.5 text-center">
      <p className="text-base font-extrabold text-ink">{value}</p>
      <p className="text-[10px] text-ink-muted">{label}</p>
    </div>
  );
}
