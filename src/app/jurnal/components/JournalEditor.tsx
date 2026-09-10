"use client";

import { useState } from "react";
import type { JournalEntry, NewJournalEntry } from "@/types/journal";
import { MOODS } from "@/types/journal";
import { todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

export default function JournalEditor({
  entry,
  onSave,
  onClose,
}: {
  entry: JournalEntry | null;
  onSave: (data: NewJournalEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [date] = useState(entry?.date ?? todayISO());
  const [saving, setSaving] = useState(false);
  const t = useT();

  async function handleSave() {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave({ title: title.trim() || t("journal.untitled"), content, mood, date });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={onClose}
          aria-label={t("app.close")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-ink transition active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs font-medium text-ink-muted">{date}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95 disabled:opacity-50"
        >
          {saving ? t("app.saving") : t("app.save")}
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("journal.titlePlaceholder")}
          autoFocus
          className="mb-3 w-full bg-transparent text-xl font-bold text-ink outline-none placeholder:text-ink-muted"
        />

        <div className="mb-4 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(mood === m ? "" : m)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                mood === m ? "bg-ink" : "bg-surface-raised"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("journal.contentPlaceholder")}
          className="min-h-[40vh] flex-1 resize-none bg-transparent text-base leading-relaxed text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
    </div>
  );
}
