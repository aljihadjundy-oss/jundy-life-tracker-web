import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { deleteDocsBatch } from "./batch";
import {
  DEFAULT_HEALTH_SETTINGS,
  EMPTY_METRICS,
  type DailyMetrics,
  type ExerciseLog,
  type Habit,
  type HabitLog,
  type HealthSettings,
  type NewHabit,
} from "@/types/kesehatan";

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

function toMetrics(date: string, data: Record<string, unknown>): DailyMetrics {
  return {
    ...EMPTY_METRICS(date),
    sleepHours: (data.sleepHours as number) ?? 0,
    exerciseMinutes: (data.exerciseMinutes as number) ?? 0,
    waterGlasses: (data.waterGlasses as number) ?? 0,
    energy: (data.energy as number) ?? 0,
    mood: (data.mood as string) ?? "",
    symptoms: (data.symptoms as string[]) ?? [],
    mealsDone: (data.mealsDone as string[]) ?? [],
    exercise: (data.exercise as ExerciseLog[]) ?? [],
  };
}

export function subscribeMetrics(uid: string, onData: (metrics: DailyMetrics[]) => void) {
  const q = query(metricsRef(uid), orderBy("date", "desc"), limit(120));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((d) => toMetrics(d.id, d.data())));
  });
}

export async function getMetrics(uid: string, date: string): Promise<DailyMetrics | null> {
  const snap = await getDoc(doc(db, "users", uid, "metrics", date));
  if (!snap.exists()) return null;
  return toMetrics(date, snap.data());
}

export async function setMetrics(uid: string, metrics: DailyMetrics) {
  await setDoc(doc(db, "users", uid, "metrics", metrics.date), metrics, { merge: true });
}

/** Partial day update — used by the water, meal, mood and symptom controls. */
export async function patchMetrics(uid: string, date: string, patch: Partial<DailyMetrics>) {
  await setDoc(doc(db, "users", uid, "metrics", date), { date, ...patch }, { merge: true });
}

// ---------------------------------------------------------------------------
// Health settings (users/{uid}/settings/health)
// ---------------------------------------------------------------------------

function healthSettingsRef(uid: string) {
  return doc(db, "users", uid, "settings", "health");
}

export function subscribeHealthSettings(uid: string, onData: (settings: HealthSettings) => void) {
  return onSnapshot(healthSettingsRef(uid), (snap) => {
    const data = (snap.data() ?? {}) as Partial<HealthSettings>;
    onData({
      ...DEFAULT_HEALTH_SETTINGS,
      ...data,
      // Nested objects would otherwise be replaced wholesale by a partial doc.
      meals: data.meals ?? DEFAULT_HEALTH_SETTINGS.meals,
      exercisePrefs: { ...DEFAULT_HEALTH_SETTINGS.exercisePrefs, ...data.exercisePrefs },
    });
  });
}

export async function saveHealthSettings(uid: string, patch: Partial<HealthSettings>) {
  await setDoc(healthSettingsRef(uid), patch, { merge: true });
}

/**
 * Deletes habits together with every check-in that belongs to them — leaving
 * the logs behind would keep inflating the streak for a habit that no longer
 * exists. Firestore caps an `in` filter at 30 values, hence the chunking.
 */
export async function deleteHabits(uid: string, ids: string[]) {
  const logRefs = [];
  for (let i = 0; i < ids.length; i += 30) {
    const snap = await getDocs(query(habitLogsRef(uid), where("habitId", "in", ids.slice(i, i + 30))));
    logRefs.push(...snap.docs.map((d) => d.ref));
  }
  await deleteDocsBatch(logRefs);
  await deleteDocsBatch(ids.map((id) => doc(db, "users", uid, "habits", id)));
}

export function deleteMetrics(uid: string, dates: string[]) {
  return deleteDocsBatch(dates.map((date) => doc(db, "users", uid, "metrics", date)));
}
