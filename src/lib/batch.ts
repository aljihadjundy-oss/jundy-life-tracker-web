import { writeBatch, type DocumentReference } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Firestore caps a batch at 500 writes. We chunk a little below that so a
 * caller can always add a companion write (a counter, a log) without
 * overflowing.
 */
const CHUNK = 400;

/** Deletes any number of documents, committing in batches of {@link CHUNK}. */
export async function deleteDocsBatch(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + CHUNK)) batch.delete(ref);
    await batch.commit();
  }
}
