import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
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
        hasAudio: data.hasAudio ?? false,
        audioSeconds: data.audioSeconds ?? 0,
        createdAt,
        updatedAt,
      } as JournalEntry;
    });
    onData(items);
  });
}

/** Returns the new document id so autosave can keep updating the same entry. */
/**
 * Membuat entri baru dan mengembalikan id-nya SEKARANG, tanpa menunggu server.
 *
 * Sebelumnya ini memakai `addDoc` dan menunggu promise-nya untuk mendapat id.
 * Saat offline promise itu tidak pernah resolve, sehingga auto-save jurnal —
 * yang memang menunggu id sebelum boleh menyimpan lagi — mengunci diri sendiri
 * dan seluruh tulisan berikutnya hilang. `doc()` membuat id di klien, jadi id
 * tersedia seketika dan tulisannya tetap antre di cache seperti biasa.
 *
 * `done` diberikan terpisah supaya pemanggil bisa melaporkan kegagalan yang
 * sungguhan tanpa harus menahan UI.
 */
export function addEntry(uid: string, entry: NewJournalEntry) {
  const ref = doc(journalRef(uid));
  const done = setDoc(ref, {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, done };
}

export async function updateEntry(uid: string, id: string, entry: Partial<NewJournalEntry>) {
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
