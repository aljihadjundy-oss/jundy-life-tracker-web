"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * One line, Enter, done. The same tag syntax the importer understands works
 * here too, so "Kirim deck @Tara #Hexolution ^2026-10-02" lands fully filled in.
 */
export default function QuickAdd({ onAdd }: { onAdd: (line: string) => Promise<void> }) {
  const t = useT();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const line = value.trim();
    if (!line || busy) return;
    setBusy(true);
    try {
      await onAdd(line);
      setValue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2 px-5">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder={t("ops.quickAddPlaceholder")}
        className="min-w-0 flex-1 rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-accent-time"
      />
      <button
        onClick={() => void submit()}
        disabled={busy || value.trim() === ""}
        className="shrink-0 rounded-xl bg-ink px-4 py-3 text-xs font-bold text-surface transition active:scale-95 disabled:opacity-40"
      >
        {t("app.add")}
      </button>
    </div>
  );
}
