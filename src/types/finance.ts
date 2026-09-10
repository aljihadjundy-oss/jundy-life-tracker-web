export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date (yyyy-mm-dd)
  createdAt: number; // epoch millis
};

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export const EXPENSE_CATEGORIES = [
  "Makan",
  "Transport",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
] as const;

export const INCOME_CATEGORIES = [
  "Gaji",
  "Bonus",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;
