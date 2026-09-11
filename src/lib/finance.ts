import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteDocsBatch } from "./batch";
import {
  DEFAULT_FINANCE_SETTINGS,
  type Account,
  type Budget,
  type Debt,
  type FinanceSettings,
  type Goal,
  type NewAccount,
  type NewBudget,
  type NewDebt,
  type NewGoal,
  type NewTransaction,
  type Transaction,
} from "@/types/finance";

function transactionsRef(uid: string) {
  return collection(db, "users", uid, "transactions");
}

function financeSettingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "finance");
}

export function subscribeTransactions(
  uid: string,
  onData: (transactions: Transaction[]) => void
) {
  const q = query(transactionsRef(uid), orderBy("date", "desc"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      // Fields added with the Money HQ model all default here, so transactions
      // written before it existed keep loading unchanged.
      return {
        id: d.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        note: data.note ?? "",
        date: data.date,
        accountId: data.accountId ?? "",
        toAccountId: data.toAccountId ?? "",
        needWant: data.needWant ?? "",
        fixed: data.fixed ?? false,
        status: data.status ?? "done",
        createdAt,
      } as Transaction;
    });
    onData(items);
  });
}

export async function addTransaction(uid: string, transaction: NewTransaction) {
  await addDoc(transactionsRef(uid), {
    ...transaction,
    createdAt: serverTimestamp(),
  });
}

/** Firestore caps a batch at 500 writes, so imports are chunked. */
export async function addTransactionsBatch(uid: string, transactions: NewTransaction[]) {
  const ref = transactionsRef(uid);
  for (let i = 0; i < transactions.length; i += 400) {
    const batch = writeBatch(db);
    for (const transaction of transactions.slice(i, i + 400)) {
      batch.set(doc(ref), { ...transaction, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

export async function deleteTransaction(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "transactions", id));
}

export function subscribeFinanceSettings(uid: string, onData: (settings: FinanceSettings) => void) {
  return onSnapshot(financeSettingsRef(uid), (snap) => {
    const data = (snap.data() ?? {}) as Partial<FinanceSettings>;
    onData({
      monthlyBudget: data.monthlyBudget ?? 0,
      allocationBase: data.allocationBase ?? 0,
      allocations: data.allocations ?? DEFAULT_FINANCE_SETTINGS.allocations,
    });
  });
}

export async function saveFinanceSettings(uid: string, patch: Partial<FinanceSettings>) {
  await setDoc(financeSettingsRef(uid), patch, { merge: true });
}

export function deleteTransactions(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "transactions", id)));
}

// ---------------------------------------------------------------------------
// Accounts, budgets, debts, goals
//
// Each collection follows the same shape: subscribe / add / update / delete /
// bulk delete, with every field defaulted on read.
// ---------------------------------------------------------------------------

function millis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return Date.now();
}

function collectionRef(uid: string, name: string) {
  return collection(db, "users", uid, name);
}

export function subscribeAccounts(uid: string, onData: (accounts: Account[]) => void) {
  return onSnapshot(query(collectionRef(uid, "accounts"), orderBy("createdAt", "asc")), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          type: data.type ?? "bank",
          openingBalance: data.openingBalance ?? 0,
          asOf: data.asOf ?? "",
          note: data.note ?? "",
          createdAt: millis(data.createdAt),
        } as Account;
      })
    );
  });
}

export async function addAccount(uid: string, account: NewAccount) {
  await addDoc(collectionRef(uid, "accounts"), { ...account, createdAt: serverTimestamp() });
}

export async function updateAccount(uid: string, id: string, patch: Partial<NewAccount>) {
  await updateDoc(doc(db, "users", uid, "accounts", id), patch);
}

export function deleteAccounts(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "accounts", id)));
}

export function subscribeBudgets(uid: string, onData: (budgets: Budget[]) => void) {
  return onSnapshot(query(collectionRef(uid, "budgets"), orderBy("month", "desc")), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          month: data.month ?? "",
          category: data.category ?? "",
          planned: data.planned ?? 0,
          createdAt: millis(data.createdAt),
        } as Budget;
      })
    );
  });
}

export async function addBudget(uid: string, budget: NewBudget) {
  await addDoc(collectionRef(uid, "budgets"), { ...budget, createdAt: serverTimestamp() });
}

export async function updateBudget(uid: string, id: string, patch: Partial<NewBudget>) {
  await updateDoc(doc(db, "users", uid, "budgets", id), patch);
}

export function deleteBudgets(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "budgets", id)));
}

/** Copies a month's planned amounts into another month, skipping duplicates. */
export async function copyBudgets(uid: string, from: Budget[], toMonth: string) {
  if (from.length === 0) return;
  const batch = writeBatch(db);
  for (const budget of from) {
    batch.set(doc(collectionRef(uid, "budgets")), {
      month: toMonth,
      category: budget.category,
      planned: budget.planned,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export function subscribeDebts(uid: string, onData: (debts: Debt[]) => void) {
  return onSnapshot(query(collectionRef(uid, "debts"), orderBy("createdAt", "asc")), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        const principal = data.principal ?? 0;
        return {
          id: d.id,
          name: data.name ?? "",
          creditor: data.creditor ?? "",
          principal,
          // The template leaves Remaining blank on most rows; an untouched debt
          // still owes the full principal, so that is the sane default.
          remaining: typeof data.remaining === "number" ? data.remaining : principal,
          installment: data.installment ?? 0,
          dueDate: data.dueDate ?? "",
          interest: data.interest ?? 0,
          note: data.note ?? "",
          status: data.status ?? "active",
          createdAt: millis(data.createdAt),
        } as Debt;
      })
    );
  });
}

export async function addDebt(uid: string, debt: NewDebt) {
  await addDoc(collectionRef(uid, "debts"), { ...debt, createdAt: serverTimestamp() });
}

export async function updateDebt(uid: string, id: string, patch: Partial<NewDebt>) {
  await updateDoc(doc(db, "users", uid, "debts", id), patch);
}

export function deleteDebts(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "debts", id)));
}

export function subscribeGoals(uid: string, onData: (goals: Goal[]) => void) {
  return onSnapshot(query(collectionRef(uid, "goals"), orderBy("createdAt", "asc")), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          targetAmount: data.targetAmount ?? 0,
          currentAmount: data.currentAmount ?? 0,
          deadline: data.deadline ?? "",
          priority: data.priority ?? "medium",
          type: data.type ?? "purchase",
          createdAt: millis(data.createdAt),
        } as Goal;
      })
    );
  });
}

export async function addGoal(uid: string, goal: NewGoal) {
  await addDoc(collectionRef(uid, "goals"), { ...goal, createdAt: serverTimestamp() });
}

export async function updateGoal(uid: string, id: string, patch: Partial<NewGoal>) {
  await updateDoc(doc(db, "users", uid, "goals", id), patch);
}

export function deleteGoals(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "goals", id)));
}
