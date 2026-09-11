"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import type { TopicCount } from "@/lib/writing";

/**
 * Kelola topik: tambah, ganti nama, arsipkan, hapus.
 *
 * Menghapus dan mengarsipkan dibedakan dengan sengaja. Arsip menyingkirkan
 * topik dari daftar pilihan tapi tulisan yang memakainya tetap utuh; hapus
 * membuang topiknya untuk selamanya dan meninggalkan id yatim di tulisan —
 * karena itu hapus hanya ditawarkan saat topiknya belum dipakai siapa pun.
 */
export default function TopicsSheet({
  topics,
  onAdd,
  onRename,
  onToggleArchive,
  onDelete,
  onClose,
}: {
  topics: TopicCount[];
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");

  function add() {
    const name = draft.trim();
    if (!name) return;
    onAdd(name);
    setDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out] md:max-w-lg md:rounded-3xl md:pb-5 md:animate-[popIn_0.18s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border md:hidden" />
        <h2 className="mb-4 text-base font-extrabold text-ink">{t("journal.manageTopics")}</h2>

        <div className="mb-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={t("journal.newTopic")}
            className="flex-1 rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
          />
          <button
            onClick={add}
            className="rounded-xl bg-ink px-4 py-3 text-sm font-bold text-surface transition active:scale-95"
          >
            {t("app.add")}
          </button>
        </div>

        <div className="space-y-2">
          {topics.map(({ topic, count }) => (
            <div
              key={topic.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised p-2.5"
            >
              <input
                defaultValue={topic.name}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  if (name && name !== topic.name) onRename(topic.id, name);
                }}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none"
              />
              <span className="shrink-0 text-xs tabular-nums text-ink-muted">{count}</span>
              <button
                onClick={() => onToggleArchive(topic.id, !topic.archived)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted transition active:scale-95"
              >
                {topic.archived ? t("journal.unarchive") : t("journal.archive")}
              </button>
              {count === 0 && (
                <button
                  onClick={() => onDelete(topic.id)}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-red-500 transition active:scale-95"
                >
                  {t("app.delete")}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{t("journal.topicsNote")}</p>
      </div>
    </div>
  );
}
