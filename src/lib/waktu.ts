import {
  addDoc,
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
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_REMINDER_MINUTES,
  DEFAULT_WAKTU_SETTINGS,
  MAX_STRIKES,
  type NewTask,
  type Task,
  type TaskCategory,
  type TaskSource,
  type TaskStatus,
  type WaktuSettings,
} from "@/types/waktu";
import { deleteDocsBatch } from "./batch";

function tasksRef(uid: string) {
  return collection(db, "users", uid, "tasks");
}

function settingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "waktu");
}

const CATEGORIES: TaskCategory[] = ["personal", "delegation", "crossbu"];
const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done", "ghosted"];
const SOURCES: TaskSource[] = ["manual", "minutes", "import"];

function millis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "number") return value;
  return null;
}

export function subscribeTasks(uid: string, onData: (tasks: Task[]) => void) {
  const q = query(tasksRef(uid), orderBy("dueDate", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      // Every field added after a task was written falls back to a default, so
      // documents from earlier versions of the app keep rendering untouched.
      return {
        id: d.id,
        title: data.title,
        note: data.note ?? "",
        dueDate: data.dueDate,
        startTime: typeof data.startTime === "string" ? data.startTime : "",
        durationMinutes: data.durationMinutes ?? DEFAULT_DURATION_MINUTES,
        reminderMinutes:
          typeof data.reminderMinutes === "number" ? data.reminderMinutes : DEFAULT_REMINDER_MINUTES,
        status: STATUSES.includes(data.status) ? data.status : "todo",
        category: CATEGORIES.includes(data.category) ? data.category : "personal",
        owner: data.owner ?? "",
        unit: data.unit ?? "",
        link: data.link ?? "",
        source: SOURCES.includes(data.source) ? data.source : "manual",
        createdAt: millis(data.createdAt) ?? Date.now(),
        completedAt: millis(data.completedAt),
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
    completedAt: task.status === "done" ? serverTimestamp() : null,
  });
}

/** Bulk insert for the meeting-notes import. Firestore caps a batch at 500. */
export async function addTasksBatch(uid: string, newTasks: NewTask[]) {
  for (let i = 0; i < newTasks.length; i += 400) {
    const batch = writeBatch(db);
    for (const task of newTasks.slice(i, i + 400)) {
      batch.set(doc(tasksRef(uid)), {
        ...task,
        createdAt: serverTimestamp(),
        completedAt: task.status === "done" ? serverTimestamp() : null,
      });
    }
    await batch.commit();
  }
}

export async function updateTask(uid: string, id: string, patch: Partial<NewTask>) {
  const update: Record<string, unknown> = {
    ...patch,
    // Any edit invalidates a reminder the scheduler may already have sent.
    notifiedFor: null,
  };
  if (patch.status) {
    update.completedAt = patch.status === "done" ? serverTimestamp() : null;
  }
  await updateDoc(doc(db, "users", uid, "tasks", id), update);
}

export async function updateTaskStatus(uid: string, id: string, status: TaskStatus) {
  await updateDoc(doc(db, "users", uid, "tasks", id), {
    status,
    completedAt: status === "done" ? serverTimestamp() : null,
  });
}

/** Moves every selected task to one status in a single round trip. */
export async function updateTaskStatuses(uid: string, ids: string[], status: TaskStatus) {
  for (let i = 0; i < ids.length; i += 400) {
    const batch = writeBatch(db);
    for (const id of ids.slice(i, i + 400)) {
      batch.update(doc(db, "users", uid, "tasks", id), {
        status,
        completedAt: status === "done" ? serverTimestamp() : null,
      });
    }
    await batch.commit();
  }
}

export async function deleteTask(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "tasks", id));
}

export function deleteTasks(uid: string, ids: string[]) {
  return deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "tasks", id)));
}

// ---------------------------------------------------------------------------
// Module settings: business units and delegation strikes
// ---------------------------------------------------------------------------

export function subscribeWaktuSettings(uid: string, onData: (settings: WaktuSettings) => void) {
  return onSnapshot(settingsRef(uid), (snap) => {
    const data = (snap.data() ?? {}) as Partial<WaktuSettings>;
    onData({
      units: Array.isArray(data.units) ? data.units : DEFAULT_WAKTU_SETTINGS.units,
      strikes: data.strikes ?? {},
    });
  });
}

export async function setUnits(uid: string, units: string[]) {
  await setDoc(settingsRef(uid), { units }, { merge: true });
}

/**
 * Cycles an owner through 0 → 1 → 2 → 3 → 0, matching the tracker's dots: one
 * tap adds a strike, and a fourth tap clears it when it was given by mistake.
 */
export async function cycleStrike(uid: string, owner: string, current: number) {
  const next = (current + 1) % (MAX_STRIKES + 1);
  await setDoc(settingsRef(uid), { strikes: { [owner]: next } }, { merge: true });
}

export async function setStrike(uid: string, owner: string, value: number) {
  await setDoc(settingsRef(uid), { strikes: { [owner]: value } }, { merge: true });
}
