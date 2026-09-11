"use client";

import { useMemo, useState } from "react";
import { parseCsv } from "@/lib/csv";
import {
  NO_COLUMN,
  buildTransactions,
  guessMapping,
  type ColumnMapping,
} from "@/lib/import-finance";
import { EXPENSE_CATEGORIES } from "@/types/finance";
import type { NewTransaction } from "@/types/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { useT } from "@/lib/i18n";

type Field = keyof ColumnMapping;
const FIELDS: Field[] = ["date", "description", "amount", "debit", "credit"];

export default function ImportSheet({
  accounts,
  onImport,
  onClose,
}: {
  /** A statement belongs to one account; every imported row lands there. */
  accounts: { id: string; name: string }[];
  onImport: (transactions: NewTransaction[]) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [category, setCategory] = useState<string>("Lainnya");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) {
        setError(t("import.emptyFile"));
        return;
      }
      setRows(parsed);
      setMapping(guessMapping(parsed[0]));
    } catch {
      setError(t("import.readFailed"));
    }
  }

  const header = rows?.[0] ?? [];
  const dataRows = useMemo(
    () => (rows ? (hasHeader ? rows.slice(1) : rows) : []),
    [rows, hasHeader]
  );

  const parsed = useMemo(
    () => (mapping ? buildTransactions(dataRows, mapping, category, accountId) : []),
    [dataRows, mapping, category, accountId]
  );
  const valid = parsed.filter((row) => row.valid);

  async function handleImport() {
    if (valid.length === 0) return;
    setImporting(true);
    try {
      await onImport(valid.map((row) => {
          const { valid: _ignored, ...rest } = row;
          void _ignored;
          return rest;
        }));
      onClose();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-ink transition active:scale-90"
          aria-label={t("app.close")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-sm font-bold text-ink">{t("import.title")}</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!rows && (
          <>
            <p className="mb-4 text-xs leading-relaxed text-ink-muted">{t("import.hint")}</p>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-raised px-6 py-10 text-center">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-semibold text-ink">{t("import.chooseFile")}</span>
              <span className="text-[11px] text-ink-muted">CSV</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
          </>
        )}

        {rows && mapping && (
          <>
            <label className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              <span className="text-xs font-medium text-ink">{t("import.hasHeader")}</span>
            </label>

            <h3 className="mb-2 text-xs font-bold text-ink">{t("import.mapColumns")}</h3>
            <div className="mb-4 flex flex-col gap-2">
              {FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-[11px] font-medium text-ink-muted">
                    {t(`import.field.${field}`)}
                  </span>
                  <select
                    value={mapping[field]}
                    onChange={(e) =>
                      setMapping({ ...mapping, [field]: Number(e.target.value) })
                    }
                    className="min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-ink outline-none focus:border-ink"
                  >
                    <option value={NO_COLUMN}>{t("import.none")}</option>
                    {header.map((cell, idx) => (
                      <option key={idx} value={idx}>
                        {hasHeader ? cell || `#${idx + 1}` : `#${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <h3 className="mb-2 text-xs font-bold text-ink">{t("import.category")}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    category === c ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                  }`}
                >
                  {t(`category.${c}`)}
                </button>
              ))}
            </div>

            {accounts.length > 0 && (
              <>
                <h3 className="mb-2 text-xs font-bold text-ink">{t("money.account")}</h3>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-ink outline-none focus:border-ink"
                >
                  <option value="">{t("money.noAccount")}</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </>
            )}

            <h3 className="mb-2 text-xs font-bold text-ink">
              {t("import.preview", { valid: valid.length, total: parsed.length })}
            </h3>
            <div className="flex flex-col gap-1.5">
              {parsed.slice(0, 8).map((row, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] ${
                    row.valid ? "bg-surface-raised" : "bg-red-500/10"
                  }`}
                >
                  <span className="w-20 shrink-0 text-ink-muted">
                    {row.date ? formatDate(row.date) : "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink">{row.note || "—"}</span>
                  <span
                    className={`shrink-0 font-bold ${
                      row.type === "income" ? "text-accent-finance" : "text-ink"
                    }`}
                  >
                    {row.type === "income" ? "+" : "-"}
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              ))}
              {parsed.length > 8 && (
                <p className="px-1 text-[10px] text-ink-muted">
                  {t("import.andMore", { count: parsed.length - 8 })}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {rows && (
        <div className="border-t border-border px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={handleImport}
            disabled={importing || valid.length === 0}
            className="w-full rounded-2xl bg-ink py-4 text-sm font-bold text-surface transition active:scale-95 disabled:opacity-50"
          >
            {importing ? t("app.saving") : t("import.confirm", { count: valid.length })}
          </button>
        </div>
      )}
    </div>
  );
}
