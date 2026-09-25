"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

/**
 * Free-form catch-all for whatever doesn't fit the structured fields above
 * (why a workout got skipped, how a symptom actually felt, anything else).
 * Commits on blur rather than every keystroke — this is the one text field
 * on the page, so there's no risk of it colliding with another save the way
 * a per-keystroke write to a shared document could.
 *
 * The caller must render this with `key={selectedDate}` — switching dates
 * needs a fresh `draft` seeded from the new day's note, and re-seeding state
 * from a changed prop belongs to a remount (via key), not a
 * setState-in-effect synchronization.
 */
export default function NoteCard({ note, onChange }: { note: string; onChange: (next: string) => void }) {
  const t = useT();
  const [draft, setDraft] = useState(note);

  return (
    <div className="mx-5 rounded-2xl bg-surface-card p-4 ring-1 ring-border/60">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{t("health.note")}</p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== note) onChange(draft);
        }}
        placeholder={t("health.notePlaceholder")}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
      />
    </div>
  );
}
