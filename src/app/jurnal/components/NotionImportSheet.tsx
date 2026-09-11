"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";
import { parseTopicsCsv, parseWritingCsv, type WritingImportResult } from "@/lib/import-writing";
import type { Topic } from "@/types/journal";

/**
 * Impor ekspor CSV dari Notion.
 *
 * Dua berkas diterima karena di Notion memang dua basis data: Topics dan
 * Writing. Berkas Topics boleh dilewati — topik yang belum ada akan dibuat
 * dari nama yang tertulis di kolom Topics pada berkas Writing.
 */
export default function NotionImportSheet({
  topics,
  onImport,
  onClose,
}: {
  topics: Topic[];
  onImport: (result: WritingImportResult) => Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [result, setResult] = useState<WritingImportResult | null>(null);
  const [extraTopics, setExtraTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const known = [...topics.map((x) => x.name), ...extraTopics];

  async function readTopics(file: File) {
    setError(null);
    const names = parseTopicsCsv(await file.text());
    if (names.length === 0) {
      setError(t("journal.importNoTopics"));
      return;
    }
    setExtraTopics(names.filter((n) => !topics.some((x) => x.name.toLowerCase() === n.toLowerCase())));
  }

  async function readWriting(file: File) {
    setError(null);
    const parsed = parseWritingCsv(await file.text(), known);
    if (parsed.rows.length === 0) {
      setError(t("journal.importNoRows"));
      setResult(null);
      return;
    }
    setResult(parsed);
  }

  async function run() {
    if (!result) return;
    setBusy(true);
    try {
      await onImport(result);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const fileInput =
    "block w-full rounded-xl border border-dashed border-border bg-surface-card px-4 py-3 text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-surface";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-extrabold text-ink">{t("journal.importTitle")}</h2>
        <button onClick={onClose} className="text-sm font-semibold text-ink-muted">
          {t("app.close")}
        </button>
      </div>

      <div className="mx-auto w-full max-w-lg flex-1 space-y-4 overflow-y-auto p-5">
        <p className="text-xs leading-relaxed text-ink-muted">{t("journal.importHint")}</p>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("journal.importTopicsFile")}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className={fileInput}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readTopics(f);
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-muted">
            {t("journal.importWritingFile")}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className={fileInput}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void readWriting(f);
            }}
          />
        </label>

        {error && (
          <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>
        )}

        {result && (
          <div className="rounded-2xl border border-border bg-surface-raised p-4">
            <p className="text-sm font-bold text-ink">
              {t("journal.importReady", { count: result.rows.length })}
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-xs text-ink-muted">
                {t("journal.importSkipped", { count: result.skipped })}
              </p>
            )}
            {(result.unknownTopics.length > 0 || extraTopics.length > 0) && (
              <p className="mt-1 text-xs text-ink-muted">
                {t("journal.importNewTopics", {
                  count: new Set([...extraTopics, ...result.unknownTopics]).size,
                })}
              </p>
            )}
            {/* Dikatakan di muka, bukan ditemukan sendiri setelah impor. */}
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              {t("journal.importNoBody")}
            </p>

            <ul className="mt-3 space-y-1">
              {result.rows.slice(0, 5).map((row, i) => (
                <li key={i} className="truncate text-xs text-ink">
                  <span className="text-ink-muted">{t(`journal.type.${row.entry.type}`)}</span>{" "}
                  {row.entry.title}
                </li>
              ))}
              {result.rows.length > 5 && (
                <li className="text-xs text-ink-muted">
                  {t("journal.importMore", { count: result.rows.length - 5 })}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          onClick={run}
          disabled={!result || busy}
          className="mx-auto block w-full max-w-lg rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-40"
        >
          {busy ? t("app.saving") : t("journal.importAction")}
        </button>
      </div>
    </div>
  );
}
