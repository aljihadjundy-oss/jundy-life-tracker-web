/**
 * Voice recordings, stored in IndexedDB on the device that made them.
 *
 * They are deliberately not synced. Cloud Storage on the Spark plan is not
 * available to this project, and packing audio into a Firestore document would
 * blow the 1 MiB document limit after about six minutes of speech. The
 * transcript is what syncs and what is searchable; the audio is the original
 * you can play back on the phone that recorded it.
 */

const DB_NAME = "andropid-audio";
const STORE = "clips";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function putClip(id: string, blob: Blob) {
  try {
    await tx("readwrite", (store) => store.put(blob, id));
    return true;
  } catch {
    // Private browsing, or storage denied. The transcript still saved.
    return false;
  }
}

export async function getClip(id: string): Promise<Blob | null> {
  try {
    return (await tx<Blob | undefined>("readonly", (store) => store.get(id))) ?? null;
  } catch {
    return null;
  }
}

export async function deleteClip(id: string) {
  try {
    await tx("readwrite", (store) => store.delete(id));
  } catch {
    // Nothing to clean up.
  }
}

/** Ids of every clip held on this device, to prune ones whose entry is gone. */
export async function listClipIds(): Promise<string[]> {
  try {
    const keys = await tx<IDBValidKey[]>("readonly", (store) => store.getAllKeys());
    return keys.map(String);
  } catch {
    return [];
  }
}
