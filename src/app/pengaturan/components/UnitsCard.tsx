"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Business units drive the Waktu filters, grouping and import tags, so they are
 * editable rather than hard-coded to one company.
 */
export default function UnitsCard({
  units,
  onChange,
}: {
  units: string[];
  onChange: (next: string[]) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");

  function add() {
    const name = draft.trim();
    if (!name || units.some((u) => u.toLowerCase() === name.toLowerCase())) return;
    onChange([...units, name]);
    setDraft("");
  }

  return (
    <div className="rounded-2xl bg-surface-card p-4 shadow-sm ring-1 ring-border/60">
      <h2 className="text-sm font-bold text-ink">{t("settings.unitsTitle")}</h2>
      <p className="mt-1 text-xs text-ink-muted">{t("settings.unitsHint")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {units.map((unit) => (
          <span
            key={unit}
            className="flex items-center gap-1.5 rounded-full bg-surface-raised py-1.5 pl-3 pr-1.5 text-xs font-semibold text-ink"
          >
            {unit}
            <button
              onClick={() => onChange(units.filter((u) => u !== unit))}
              aria-label={t("app.delete")}
              className="flex h-5 w-5 items-center justify-center rounded-full text-ink-muted transition hover:bg-red-500/15 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
        {units.length === 0 && <p className="text-xs text-ink-muted">{t("settings.unitsEmpty")}</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={t("settings.unitsPlaceholder")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
        />
        <button
          onClick={add}
          disabled={draft.trim() === ""}
          className="shrink-0 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-surface transition active:scale-95 disabled:opacity-40"
        >
          {t("app.add")}
        </button>
      </div>
    </div>
  );
}
