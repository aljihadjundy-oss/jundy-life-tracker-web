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
} from "firebase/firestore";
import { db } from "./firebase";
import type { NewTransaction, Transaction } from "@/types/finance";

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
      return {
        id: d.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        note: data.note ?? "",
        date: data.date,
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

export async function deleteTransaction(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "transactions", id));
}

export function subscribeMonthlyBudget(uid: string, onData: (budget: number) => void) {
  return onSnapshot(financeSettingsRef(uid), (snap) => {
    onData(snap.exists() ? (snap.data().monthlyBudget ?? 0) : 0);
  });
}

export async function setMonthlyBudget(uid: string, amount: number) {
  await setDoc(financeSettingsRef(uid), { monthlyBudget: amount }, { merge: true });
}
