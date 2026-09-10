import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DailyMetrics, Habit, HabitLog, NewHabit } from "@/types/kesehatan";

function habitsRef(uid: string) {
  return collection(db, "users", uid, "habits");
}

function habitLogsRef(uid: string) {
  return collection(db, "users", uid, "habitLogs");
}

function metricsRef(uid: string) {
  return collection(db, "users", uid, "metrics");
}

export function subscribeHabits(uid: string, onData: (habits: Habit[]) => void) {
  const q = query(habitsRef(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
      return { id: d.id, name: data.name, createdAt } as Habit;
    });
    onData(items);
  });
}

export async function addHabit(uid: string, habit: NewHabit) {
  await addDoc(habitsRef(uid), {
    ...habit,
    createdAt: serverTimestamp(),
  });
}

export async function deleteHabit(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "habits", id));
}

// Last ~120 days of logs is plenty for streak calculation without
// the read set growing unbounded as history piles up.
export function subscribeHabitLogs(uid: string, onData: (logs: HabitLog[]) => void) {
  const q = query(habitLogsRef(uid), orderBy("date", "desc"), limit(120 * 20));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => d.data() as HabitLog);
    onData(items);
  });
}

function habitLogId(date: string, habitId: string) {
  return `${date}_${habitId}`;
}

export async function setHabitLog(uid: string, habitId: string, date: string, completed: boolean) {
  const ref = doc(db, "users", uid, "habitLogs", habitLogId(date, habitId));
  if (completed) {
    await setDoc(ref, { habitId, date });
  } else {
    await deleteDoc(ref);
  }
}

export function subscribeMetrics(uid: string, onData: (metrics: DailyMetrics[]) => void) {
  const q = query(metricsRef(uid), orderBy("date", "desc"), limit(120));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        date: d.id,
        sleepHours: data.sleepHours ?? 0,
        exerciseMinutes: data.exerciseMinutes ?? 0,
        waterGlasses: data.waterGlasses ?? 0,
      } as DailyMetrics;
    });
    onData(items);
  });
}

export async function getMetrics(uid: string, date: string): Promise<DailyMetrics | null> {
  const snap = await getDoc(doc(db, "users", uid, "metrics", date));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    date,
    sleepHours: data.sleepHours ?? 0,
    exerciseMinutes: data.exerciseMinutes ?? 0,
    waterGlasses: data.waterGlasses ?? 0,
  };
}

export async function setMetrics(uid: string, metrics: DailyMetrics) {
  await setDoc(doc(db, "users", uid, "metrics", metrics.date), metrics, { merge: true });
}
