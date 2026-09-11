import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteDocsBatch } from "./batch";
import type { JournalEntry, NewJournalEntry } from "@/types/journal";

function journalRef(uid: string) {
  return collection(db, "users", uid, "journal");
}

export function subscribeEntries(uid: string, onData: (entries: JournalEntry[]) => void) {
  const q = query(journalRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : createdAt;
      return {
        id: d.id,
        title: data.title,
        content: data.content,
        mood: data.mood ?? "",
        date: data.date,
        createdAt,
        updatedAt,
      } as JournalEntry;
    });
    onData(items);
  });
}

export async function addEntry(uid: string, entry: NewJournalEntry) {
  await addDoc(journalRef(uid), {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEntry(uid: string, id: string, entry: NewJournalEntry) {
  await updateDoc(doc(db, "users", uid, "journal", id), {
    ...entry,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntry(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "journal", id));
}

export function deleteEntries(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "journal", id)));
}
