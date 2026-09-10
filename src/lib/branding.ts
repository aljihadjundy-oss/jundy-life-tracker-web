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
import type { ContentItem, ContentStatus, NewContentItem } from "@/types/branding";

function contentRef(uid: string) {
  return collection(db, "users", uid, "content");
}

export function subscribeContent(uid: string, onData: (items: ContentItem[]) => void) {
  const q = query(contentRef(uid), orderBy("postDate", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      return {
        id: d.id,
        title: data.title,
        platform: data.platform,
        postDate: data.postDate,
        status: data.status,
        note: data.note ?? "",
        createdAt,
      } as ContentItem;
    });
    onData(items);
  });
}

export async function addContent(uid: string, item: NewContentItem) {
  await addDoc(contentRef(uid), {
    ...item,
    createdAt: serverTimestamp(),
  });
}

export async function updateContentStatus(uid: string, id: string, status: ContentStatus) {
  await updateDoc(doc(db, "users", uid, "content", id), { status });
}

export async function deleteContent(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "content", id));
}
