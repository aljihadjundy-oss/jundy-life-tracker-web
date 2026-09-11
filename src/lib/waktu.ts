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
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_REMINDER_MINUTES,
  type NewTask,
  type Task,
  type TaskStatus,
} from "@/types/waktu";
import { deleteDocsBatch } from "./batch";

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
        // Tasks created before the calendar existed have no clock time; they
        // stay valid and simply render in the all-day row.
        startTime: typeof data.startTime === "string" ? data.startTime : "",
        durationMinutes: data.durationMinutes ?? DEFAULT_DURATION_MINUTES,
        reminderMinutes:
          typeof data.reminderMinutes === "number" ? data.reminderMinutes : DEFAULT_REMINDER_MINUTES,
        status: data.status,
        createdAt,
      } as Task;
    });
    // Firestore can only order by dueDate; the clock time is a second key we
    // apply here so the agenda reads top-to-bottom like a day planner.
    items.sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (!a.startTime) return b.startTime ? -1 : 0;
      if (!b.startTime) return 1;
      return a.startTime.localeCompare(b.startTime);
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

export async function updateTask(uid: string, id: string, patch: Partial<NewTask>) {
  await updateDoc(doc(db, "users", uid, "tasks", id), {
    ...patch,
    // Any edit invalidates a reminder the scheduler may already have sent.
    notifiedFor: null,
  });
}

export async function updateTaskStatus(uid: string, id: string, status: TaskStatus) {
  await updateDoc(doc(db, "users", uid, "tasks", id), { status });
}

export async function deleteTask(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "tasks", id));
}

export function deleteTasks(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "tasks", id)));
}
