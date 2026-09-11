import { toISODate } from "./format";
import type { NewTransaction } from "@/types/finance";

export type ColumnMapping = {
  date: number;
  description: number;
  /** Single column holding a signed amount, or -1 when debit/credit are split. */
  amount: number;
  debit: number;
  credit: number;
};

export const NO_COLUMN = -1;

const HEADER_HINTS: Record<keyof ColumnMapping, string[]> = {
  date: ["tanggal", "tgl", "date", "waktu", "transaction date", "posting date"],
  description: ["keterangan", "uraian", "deskripsi", "description", "remark", "berita", "catatan", "narasi"],
  amount: ["jumlah", "nominal", "amount", "mutasi", "nilai"],
  debit: ["debit", "debet", "keluar", "withdrawal", "pengeluaran"],
  credit: ["kredit", "credit", "masuk", "deposit", "pemasukan"],
};

/** Best-effort guess of which column is which, based on the header row. */
export function guessMapping(header: string[]): ColumnMapping {
  const lower = header.map((h) => h.toLowerCase());
  const find = (key: keyof ColumnMapping) => {
    const idx = lower.findIndex((h) => HEADER_HINTS[key].some((hint) => h.includes(hint)));
    return idx;
  };

  const debit = find("debit");
  const credit = find("credit");
  return {
    date: find("date"),
    description: find("description"),
    // Prefer split debit/credit columns when both exist — they carry the
    // direction, which a single unsigned "amount" column usually doesn't.
    amount: debit !== NO_COLUMN && credit !== NO_COLUMN ? NO_COLUMN : find("amount"),
    debit,
    credit,
  };
}

/**
 * Parses numbers from bank exports, which mix "1.234.567,89" (Indonesian) and
 * "1,234,567.89" (English) grouping. The last separator present decides which
 * character is the decimal point.
 */
export function parseAmount(raw: string): number {
  if (!raw) return 0;
  let text = raw.replace(/[^\d.,-]/g, "").trim();
  if (!text) return 0;

  const negative = text.startsWith("-");
  if (negative) text = text.slice(1);

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
    else text = text.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // A lone comma is a decimal point only when it separates 1-2 trailing digits.
    const decimals = text.length - lastComma - 1;
    text = decimals <= 2 ? text.replace(",", ".") : text.replace(/,/g, "");
  } else if (lastDot !== -1) {
    const decimals = text.length - lastDot - 1;
    if (decimals === 3) text = text.replace(/\./g, "");
  }

  const value = Number(text);
  if (!Number.isFinite(value)) return 0;
  return negative ? -value : value;
}

/** Accepts yyyy-mm-dd, dd/mm/yyyy, dd-mm-yy and similar; returns ISO or "". */
export function parseDate(raw: string): string {
  const text = raw.trim();
  if (!text) return "";

  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : toISODate(parsed);
}

export type ParsedRow = NewTransaction & { valid: boolean };

export function buildTransactions(
  rows: string[][],
  mapping: ColumnMapping,
  category: string,
  /** Statements come from one account, so every row lands in that account. */
  accountId = ""
): ParsedRow[] {
  return rows.map((row) => {
    const date = parseDate(row[mapping.date] ?? "");
    const note = (row[mapping.description] ?? "").slice(0, 140);

    let amount = 0;
    let type: NewTransaction["type"] = "expense";

    if (mapping.amount !== NO_COLUMN) {
      const value = parseAmount(row[mapping.amount] ?? "");
      type = value >= 0 ? "income" : "expense";
      amount = Math.abs(value);
    } else {
      const debit = parseAmount(row[mapping.debit] ?? "");
      const credit = parseAmount(row[mapping.credit] ?? "");
      if (credit > 0) {
        type = "income";
        amount = credit;
      } else {
        type = "expense";
        amount = Math.abs(debit);
      }
    }

    return {
      date,
      note,
      amount,
      type,
      category,
      accountId,
      toAccountId: "",
      needWant: "",
      fixed: false,
      status: "done",
      valid: Boolean(date) && amount > 0,
    };
  });
}
