"use client";

import { useMemo, useState } from "react";
import type { NewTask, TaskSource } from "@/types/waktu";
import { parseTaskLines, toNewTasks, type ParsedTask } from "@/lib/import-tasks";
import { formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { CategoryPill } from "./StatusPill";

/**
 * Paste minutes, see exactly what will be created, then save. The preview is
 * the point: the parser is rule-based, so the user needs to spot a bad guess
 * before it becomes thirty wrong tasks.
 */
export default function ImportSheet({
  units,
  onImport,
  onClose,
}: {
  units: string[];
  onImport: (tasks: NewTask[]) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [text, setText] = useState("");
  const [source, setSource] = useState<TaskSource>("minutes");
  const [saving, setSaving] = useState(false);

  const parsed: ParsedTask[] = useMemo(() => parseTaskLines(text, units), [text, units]);

  async function handleImport() {
    if (parsed.length === 0) return;
    setSaving(true);
    try {
      await onImport(toNewTasks(parsed, source));
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
        <h2 className="text-base font-extrabold text-ink">{t("ops.import")}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{t("ops.importHint")}</p>

        <div className="mt-3 flex gap-2">
          {(["minutes", "import"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSource(value)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                source === value ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t(`ops.source.${value}`)}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder={t("ops.importPlaceholder")}
          className="mt-3 w-full resize-y rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-accent-time"
        />

        <p className="mt-2 rounded-xl bg-surface-raised px-3 py-2.5 text-[11px] leading-relaxed text-ink-muted">
          {t("ops.importSyntax")}
        </p>

        {text.trim() !== "" && (
          <div className="mt-4">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              {t("ops.importPreview", { count: parsed.length })}
            </h3>

            {parsed.length === 0 ? (
              <p className="rounded-2xl bg-surface-raised p-5 text-center text-xs text-ink-muted">
                {t("ops.importNothing")}
              </p>
            ) : (
              <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                {parsed.map((item, i) => (
                  <div key={i} className="rounded-xl bg-surface-card p-3 ring-1 ring-border/60">
                    <p className="text-xs font-semibold text-ink">{item.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <CategoryPill category={item.category} />
                      {item.unit && (
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                          {item.unit}
                        </span>
                      )}
                      {item.owner && (
                        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink">
                          {item.owner}
                        </span>
                      )}
                      <span className="text-[10px] text-ink-muted">{formatDate(item.dueDate)}</span>
                    </div>
                    {item.note && <p className="mt-1 text-[11px] text-ink-muted">{item.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={saving || parsed.length === 0}
          className="mt-5 w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-40"
        >
          {saving ? t("app.saving") : t("ops.importAdd", { count: parsed.length })}
        </button>
      </div>
    </div>
  );
}
