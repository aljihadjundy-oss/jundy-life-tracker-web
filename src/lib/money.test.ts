import assert from "node:assert/strict";
import { test } from "vitest";
import type { Account, Budget, Debt, Goal, Transaction } from "@/types/finance";
import {
  accountBalance,
  allocationLines,
  allocationTotal,
  budgetLine,
  goalProgress,
  monthSummary,
  monthlyInstallments,
  needWantSplit,
  netWorth,
  spendByCategory,
  totalAssets,
  totalDebt,
  unassignedTransactions,
} from "./money";

// Fixtures spell out only what each test cares about; everything else takes a
// neutral default, so a test failing points at the field it actually exercises.

function tx(patch: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    type: "expense",
    amount: 0,
    category: "lain",
    note: "",
    date: "2026-09-11",
    accountId: "a1",
    toAccountId: "",
    needWant: "",
    fixed: false,
    status: "done",
    createdAt: 0,
    ...patch,
  };
}

function account(patch: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "BCA",
    type: "bank",
    openingBalance: 0,
    asOf: "2026-09-01",
    note: "",
    createdAt: 0,
    ...patch,
  };
}

function debt(patch: Partial<Debt> = {}): Debt {
  return {
    id: "d1",
    name: "Cicilan",
    creditor: "",
    principal: 0,
    remaining: 0,
    installment: 0,
    dueDate: "",
    interest: 0,
    note: "",
    status: "active",
    createdAt: 0,
    ...patch,
  };
}

function budget(patch: Partial<Budget> = {}): Budget {
  return { id: "b1", month: "2026-09", category: "makan", planned: 0, createdAt: 0, ...patch };
}

function goal(patch: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    name: "Dana darurat",
    type: "emergency",
    priority: "high",
    targetAmount: 0,
    currentAmount: 0,
    deadline: "",
    note: "",
    createdAt: 0,
    ...patch,
  } as Goal;
}

// ---------------------------------------------------------------------------
// accountBalance — the function that shipped a real bug
// ---------------------------------------------------------------------------

test("REGRESI: transaksi pada hari asOf tetap dihitung", () => {
  // Bug yang lolos ke produksi: `tx.date <= account.asOf` melewati transaksi
  // yang tanggalnya sama dengan asOf. Karena akun baru selalu ber-asOf hari
  // ini, saldonya tidak pernah bergerak untuk apa pun yang dicatat hari itu —
  // persis saat akun baru menerima transaksi pertamanya.
  const acc = account({ openingBalance: 1_000_000, asOf: "2026-09-11" });
  const balance = accountBalance(acc, [tx({ date: "2026-09-11", type: "expense", amount: 250_000 })]);
  assert.equal(balance, 750_000);
});

test("transaksi sebelum asOf diabaikan", () => {
  const acc = account({ openingBalance: 1_000_000, asOf: "2026-09-01" });
  const balance = accountBalance(acc, [tx({ date: "2026-08-31", amount: 999_000 })]);
  assert.equal(balance, 1_000_000);
});

test("pemasukan menambah, pengeluaran mengurangi", () => {
  const balance = accountBalance(account({ openingBalance: 100 }), [
    tx({ id: "t1", type: "income", amount: 50 }),
    tx({ id: "t2", type: "expense", amount: 30 }),
  ]);
  assert.equal(balance, 120);
});

test("transaksi pending tidak menggerakkan saldo", () => {
  const balance = accountBalance(account({ openingBalance: 100 }), [
    tx({ type: "expense", amount: 40, status: "pending" }),
  ]);
  assert.equal(balance, 100);
});

test("transfer keluar dari sumber dan masuk ke tujuan", () => {
  const transfer = tx({ type: "transfer", amount: 200, accountId: "a1", toAccountId: "a2" });
  assert.equal(accountBalance(account({ id: "a1", openingBalance: 500 }), [transfer]), 300);
  assert.equal(accountBalance(account({ id: "a2", openingBalance: 0 }), [transfer]), 200);
});

test("transfer tidak mengubah total aset", () => {
  // Invarian: memindahkan uang antar rekening sendiri bukan pemasukan atau
  // pengeluaran, jadi jumlah seluruh rekening harus tetap.
  const accounts = [account({ id: "a1", openingBalance: 500 }), account({ id: "a2", openingBalance: 100 })];
  const before = totalAssets(accounts, []);
  const after = totalAssets(accounts, [
    tx({ type: "transfer", amount: 200, accountId: "a1", toAccountId: "a2" }),
  ]);
  assert.equal(before, 600);
  assert.equal(after, 600);
});

test("transaksi milik rekening lain tidak ikut dihitung", () => {
  const balance = accountBalance(account({ id: "a1", openingBalance: 100 }), [
    tx({ accountId: "a2", amount: 70 }),
  ]);
  assert.equal(balance, 100);
});

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

test("budgetLine menjumlahkan pengeluaran pada kategori dan bulan yang sama", () => {
  const line = budgetLine(budget({ category: "makan", planned: 1000, month: "2026-09" }), [
    tx({ id: "t1", category: "makan", amount: 300, date: "2026-09-02" }),
    tx({ id: "t2", category: "makan", amount: 200, date: "2026-09-20" }),
    tx({ id: "t3", category: "makan", amount: 999, date: "2026-08-20" }), // bulan lain
    tx({ id: "t4", category: "transport", amount: 999, date: "2026-09-03" }), // kategori lain
    tx({ id: "t5", category: "makan", amount: 999, date: "2026-09-04", type: "income" }), // bukan belanja
  ]);
  assert.equal(line.actual, 500);
  assert.equal(line.remaining, 500);
  assert.equal(line.status, "safe");
  assert.equal(line.ratio, 0.5);
});

test("status budget: limit saat pas, over saat lewat", () => {
  const pas = budgetLine(budget({ planned: 100 }), [tx({ category: "makan", amount: 100 })]);
  assert.equal(pas.status, "limit");
  const lewat = budgetLine(budget({ planned: 100 }), [tx({ category: "makan", amount: 150 })]);
  assert.equal(lewat.status, "over");
  assert.equal(lewat.remaining, -50);
  assert.equal(lewat.ratio, 1, "rasio dijepit di 1 supaya bar tidak meluber");
});

test("budget nol tidak menghasilkan pembagian dengan nol", () => {
  const line = budgetLine(budget({ planned: 0 }), [tx({ category: "makan", amount: 50 })]);
  assert.equal(line.ratio, 0);
  assert.equal(Number.isFinite(line.ratio), true);
});

// ---------------------------------------------------------------------------
// Utang, target, net worth
// ---------------------------------------------------------------------------

test("utang lunas tidak ikut total maupun cicilan bulanan", () => {
  const debts = [
    debt({ id: "d1", remaining: 500, installment: 50, status: "active" }),
    debt({ id: "d2", remaining: 300, installment: 30, status: "late" }),
    debt({ id: "d3", remaining: 999, installment: 99, status: "paid" }),
  ];
  assert.equal(totalDebt(debts), 800);
  assert.equal(monthlyInstallments(debts), 80);
});

test("netWorth = aset - utang", () => {
  const result = netWorth(
    [account({ openingBalance: 1000 })],
    [tx({ type: "expense", amount: 200 })],
    [debt({ remaining: 300 })]
  );
  assert.deepEqual(result, { assets: 800, debt: 300, net: 500 });
});

test("target dengan nilai nol tidak meledak", () => {
  const kosong = goalProgress(goal({ targetAmount: 0, currentAmount: 0 }));
  assert.equal(kosong.ratio, 0);
  assert.equal(kosong.remaining, 0);
});

test("target terlampaui dijepit di 1 dan sisa tidak negatif", () => {
  const lewat = goalProgress(goal({ targetAmount: 100, currentAmount: 150 }));
  assert.equal(lewat.ratio, 1);
  assert.equal(lewat.remaining, 0);
});

// ---------------------------------------------------------------------------
// Ringkasan bulan & rincian
// ---------------------------------------------------------------------------

test("monthSummary hanya menghitung bulan yang diminta", () => {
  const summary = monthSummary(
    [
      tx({ id: "t1", type: "income", amount: 5000, date: "2026-09-01" }),
      tx({ id: "t2", type: "expense", amount: 2000, date: "2026-09-15", category: "makan" }),
      tx({ id: "t3", type: "expense", amount: 9999, date: "2026-08-15", category: "makan" }),
    ],
    [budget({ month: "2026-09", category: "makan", planned: 2500 })],
    "2026-09"
  );
  assert.equal(summary.income, 5000);
  assert.equal(summary.expense, 2000);
  assert.equal(summary.net, 3000);
  assert.equal(summary.planned, 2500);
  assert.equal(summary.actual, 2000);
  assert.equal(summary.budgetLeft, 500);
});

test("transfer bukan pemasukan maupun pengeluaran di ringkasan bulan", () => {
  const summary = monthSummary(
    [tx({ type: "transfer", amount: 1000, date: "2026-09-05", toAccountId: "a2" })],
    [],
    "2026-09"
  );
  assert.equal(summary.income, 0);
  assert.equal(summary.expense, 0);
  assert.equal(summary.net, 0);
});

test("spendByCategory diurutkan menurun dan rasionya berjumlah 1", () => {
  const rows = spendByCategory(
    [
      tx({ id: "t1", category: "makan", amount: 300 }),
      tx({ id: "t2", category: "transport", amount: 700 }),
      tx({ id: "t3", category: "makan", amount: 200 }),
    ],
    "2026-09"
  );
  assert.deepEqual(
    rows.map((r) => [r.category, r.amount]),
    [
      ["transport", 700],
      ["makan", 500],
    ]
  );
  assert.equal(rows.reduce((sum, r) => sum + r.ratio, 0), 1);
});

test("needWantSplit: yang tak bertanda tetap masuk total", () => {
  const split = needWantSplit(
    [
      tx({ id: "t1", needWant: "need", amount: 100 }),
      tx({ id: "t2", needWant: "want", amount: 60 }),
      tx({ id: "t3", needWant: "", amount: 40 }),
    ],
    "2026-09"
  );
  assert.deepEqual(split, { need: 100, want: 60, untagged: 40, total: 200 });
});

test("unassignedTransactions menangkap transaksi tanpa rekening", () => {
  const rows = unassignedTransactions([tx({ id: "t1", accountId: "" }), tx({ id: "t2", accountId: "a1" })]);
  assert.deepEqual(rows.map((r) => r.id), ["t1"]);
});

// ---------------------------------------------------------------------------
// Alokasi
// ---------------------------------------------------------------------------

test("allocationLines membagi basis menurut persen", () => {
  const lines = allocationLines(
    [
      { key: "kebutuhan", label: "Kebutuhan", percent: 50 },
      { key: "tabungan", label: "Tabungan", percent: 30 },
      { key: "senang", label: "Senang-senang", percent: 20 },
    ] as never,
    10_000_000
  );
  assert.deepEqual(lines.map((l) => l.amount), [5_000_000, 3_000_000, 2_000_000]);
});

test("allocationTotal menjumlahkan persen, untuk menandai rencana yang tidak 100%", () => {
  assert.equal(allocationTotal([{ percent: 50 }, { percent: 30 }] as never), 80);
});
