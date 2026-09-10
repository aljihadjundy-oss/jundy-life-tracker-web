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
import type { NewTask, Task, TaskStatus } from "@/types/waktu";

function tasksRef(uid: string) {
  return collection(db, "users", uid, "tasks");
}

export function subscribeTasks(uid: string, onData: (tasks: Task[]) => void) {
  const q = query(tasksRef(uid), orderBy("dueDate", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      return {
        id: d.id,
        title: data.title,
        note: data.note ?? "",
        dueDate: data.dueDate,
        status: data.status,
        createdAt,
      } as Task;
    });
    onData(items);
  });
}

export async function addTask(uid: string, task: NewTask) {
  await addDoc(tasksRef(uid), {
    ...task,
    createdAt: serverTimestamp(),
  });
}

export async function updateTaskStatus(uid: string, id: string, status: TaskStatus) {
  await updateDoc(doc(db, "users", uid, "tasks", id), { status });
}

export async function deleteTask(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "tasks", id));
}
