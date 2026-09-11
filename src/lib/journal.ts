import {
  collection,
  deleteDoc,
  getDocs,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteDocsBatch } from "./batch";
import { EMPTY_WRITING_FIELDS, type JournalEntry, type NewJournalEntry, type NewTopic, type Topic, type WritingType } from "@/types/journal";

function journalRef(uid: string) {
  return collection(db, "users", uid, "journal");
}

function topicsRef(uid: string) {
  return collection(db, "users", uid, "topics");
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
        // Entri yang dibuat sebelum perpustakaan tulisan ada tidak punya
        // bidang-bidang ini sama sekali. Dibaca dengan bekal bawaan di sini,
        // bukan lewat migrasi massal: catatan lama tetap sah apa adanya, dan
        // tidak ada satu pun dokumen yang perlu ditulis ulang.
        type: (data.type as WritingType) ?? EMPTY_WRITING_FIELDS.type,
        topicIds: Array.isArray(data.topicIds) ? (data.topicIds as string[]) : [],
        description: data.description ?? "",
        favorite: data.favorite ?? false,
        finished: data.finished ?? false,
        archived: data.archived ?? false,
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


// ---------------------------------------------------------------------------
// Topik
// ---------------------------------------------------------------------------

export function subscribeTopics(uid: string, onData: (topics: Topic[]) => void) {
  const q = query(topicsRef(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    onData(
      snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name ?? "",
          archived: data.archived ?? false,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0,
        } as Topic;
      })
    );
  });
}

export function addTopic(uid: string, topic: NewTopic) {
  const ref = doc(topicsRef(uid));
  const done = setDoc(ref, { ...topic, createdAt: serverTimestamp() });
  return { id: ref.id, done };
}

export async function updateTopic(uid: string, id: string, patch: Partial<NewTopic>) {
  await updateDoc(doc(db, "users", uid, "topics", id), { ...patch });
}

export async function deleteTopic(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "topics", id));
}

/**
 * Menyiapkan topik bawaan, sekali saja.
 *
 * Dikerjakan dalam satu batch dan hanya kalau koleksinya benar-benar kosong —
 * kalau dipanggil dua kali (dua tab, atau satu kali muat ulang di tengah
 * jalan), yang kedua tidak menulis apa-apa alih-alih menggandakan daftarnya.
 */
export async function seedTopics(uid: string, names: readonly string[]) {
  const existing = await getDocs(topicsRef(uid));
  if (!existing.empty) return [] as Topic[];

  const batch = writeBatch(db);
  const created: Topic[] = [];
  for (const name of names) {
    const ref = doc(topicsRef(uid));
    batch.set(ref, { name, archived: false, createdAt: serverTimestamp() });
    created.push({ id: ref.id, name, archived: false, createdAt: Date.now() });
  }
  await batch.commit();
  return created;
}

/** Impor banyak tulisan sekaligus — dipakai importir ekspor Notion. */
export async function addEntriesBatch(uid: string, entries: NewJournalEntry[]) {
  const ref = journalRef(uid);
  // Firestore membatasi satu batch di 500 tulisan.
  for (let i = 0; i < entries.length; i += 400) {
    const batch = writeBatch(db);
    for (const entry of entries.slice(i, i + 400)) {
      batch.set(doc(ref), { ...entry, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    await batch.commit();
  }
}
