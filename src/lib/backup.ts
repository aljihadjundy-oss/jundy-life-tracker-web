import { collection, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Cadangan dan pemulihan seluruh data pengguna.
 *
 * Sebelum ini semua catatan hidup di satu project Firebase yang terikat ke satu
 * akun Google — kehilangan akses ke akun itu berarti kehilangan semuanya, dan
 * tidak ada satu pun cara mengeluarkan datanya. Export CSV yang sudah ada hanya
 * mencakup task dan transaksi, dan CSV tidak bisa dimuat kembali.
 *
 * Export tanpa import bukan cadangan, hanya salinan untuk dibaca. Karena itu
 * `restoreBackup` ada di sini juga.
 */

/** Setiap koleksi di bawah users/{uid}. */
const COLLECTIONS = [
  "transactions",
  "accounts",
  "budgets",
  "debts",
  "goals",
  "tasks",
  "content",
  "habits",
  "habitLogs",
  "metrics",
  "journal",
] as const;

/** Dokumen tunggal, dialamatkan sebagai "induk/anak". */
const SINGLETONS = [
  ["settings", "finance"],
  ["settings", "waktu"],
  ["settings", "branding"],
  ["settings", "health"],
  ["settings", "notifications"],
  ["settings", "pillars"],
  ["settings", "profile"],
  ["gamification", "stats"],
] as const;

/** Dinaikkan kalau bentuk berkasnya berubah, supaya restore bisa menolak. */
const BACKUP_VERSION = 1;

export type Backup = {
  app: "andropid";
  version: number;
  exportedAt: string;
  uid: string;
  collections: Record<string, Record<string, unknown>[]>;
  singletons: Record<string, unknown>;
};

export async function buildBackup(uid: string): Promise<Backup> {
  const collections: Backup["collections"] = {};
  // Berurutan, bukan paralel — cadangan bisa dijalankan di koneksi seluler dan
  // membuka 11 permintaan sekaligus hanya membuat semuanya lebih lambat.
  for (const name of COLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, name));
    collections[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const singletons: Backup["singletons"] = {};
  for (const [parent, child] of SINGLETONS) {
    const snap = await getDoc(doc(db, "users", uid, parent, child));
    if (snap.exists()) singletons[`${parent}/${child}`] = snap.data();
  }

  return {
    app: "andropid",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    uid,
    collections,
    singletons,
  };
}

export function downloadBackup(backup: Backup) {
  if (typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `andropid-backup_${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): Backup {
  const data: unknown = JSON.parse(text);
  if (typeof data !== "object" || data === null) throw new Error("backup.invalid");
  const backup = data as Partial<Backup>;
  if (backup.app !== "andropid") throw new Error("backup.invalid");
  if (backup.version !== BACKUP_VERSION) throw new Error("backup.version");
  if (typeof backup.collections !== "object" || backup.collections === null) {
    throw new Error("backup.invalid");
  }
  return backup as Backup;
}

export type RestoreResult = { documents: number };

/**
 * Menulis ulang isi cadangan ke akun yang sedang masuk.
 *
 * Menimpa per-dokumen, tidak menghapus apa pun yang tidak ada di berkas — jadi
 * memulihkan cadangan lama tidak akan membuang catatan yang dibuat setelahnya.
 * `uid` diambil dari sesi sekarang, bukan dari berkas, supaya cadangan tetap
 * bisa dipulihkan ke akun yang berbeda.
 */
export async function restoreBackup(uid: string, backup: Backup): Promise<RestoreResult> {
  let documents = 0;
  let batch = writeBatch(db);
  let pending = 0;

  // Firestore membatasi satu batch di 500 tulisan.
  const flush = async () => {
    if (pending === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    pending = 0;
  };

  for (const name of COLLECTIONS) {
    for (const row of backup.collections[name] ?? []) {
      const { id, ...rest } = row as { id?: string };
      if (typeof id !== "string" || id === "") continue;
      batch.set(doc(db, "users", uid, name, id), rest);
      documents += 1;
      if (++pending === 400) await flush();
    }
  }

  for (const [parent, child] of SINGLETONS) {
    const value = backup.singletons?.[`${parent}/${child}`];
    if (!value || typeof value !== "object") continue;
    batch.set(doc(db, "users", uid, parent, child), value, { merge: true });
    documents += 1;
    if (++pending === 400) await flush();
  }

  await flush();
  return { documents };
}
