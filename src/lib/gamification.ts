import { doc, onSnapshot, runTransaction, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { addDaysISO, todayISO } from "./format";
import {
  BADGES,
  EMPTY_STATS,
  XP_REWARDS,
  levelFromXp,
  type GameAction,
  type GameCounters,
  type GameStats,
} from "@/types/gamification";

// Keeps the daily XP map from growing without bound — roughly a year of
// history is far more than any streak or chart needs.
const MAX_HISTORY_DAYS = 400;

const COUNTER_BY_ACTION: Record<GameAction, keyof GameCounters> = {
  transaction: "transactions",
  task: "tasksDone",
  habit: "habitsChecked",
  journal: "journalEntries",
  post: "postsPublished",
};

function statsRef(uid: string) {
  return doc(db, "users", uid, "gamification", "stats");
}

function normalize(data: Record<string, unknown> | undefined): GameStats {
  const counters = (data?.counters ?? {}) as Partial<GameCounters>;
  return {
    totalXp: (data?.totalXp as number) ?? 0,
    dailyGoal: (data?.dailyGoal as number) ?? EMPTY_STATS.dailyGoal,
    xpByDate: (data?.xpByDate as Record<string, number>) ?? {},
    unlockedBadges: (data?.unlockedBadges as string[]) ?? [],
    counters: { ...EMPTY_STATS.counters, ...counters },
  };
}

export function subscribeStats(uid: string, onData: (stats: GameStats) => void) {
  return onSnapshot(statsRef(uid), (snap) => onData(normalize(snap.data())));
}

/** Consecutive days (ending today) where the daily XP goal was met. */
export function computeStreak(stats: GameStats) {
  const today = todayISO();
  // A zero goal would make every day count and never terminate, so the loop is
  // also bounded by how much history we keep.
  const goal = Math.max(1, stats.dailyGoal);
  let streak = 0;
  for (let i = 0; i <= MAX_HISTORY_DAYS; i++) {
    const date = addDaysISO(today, -i);
    const earned = stats.xpByDate[date] ?? 0;
    if (earned >= goal) streak++;
    // Today not finished yet shouldn't break a streak built up to yesterday.
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export function earnedBadges(stats: GameStats) {
  const level = levelFromXp(stats.totalXp);
  const streak = computeStreak(stats);
  return BADGES.filter((b) => b.earned({ stats, level, streak })).map((b) => b.id);
}

export type AwardResult = {
  xpGained: number;
  totalXp: number;
  leveledUpTo: number | null;
  newBadges: string[];
  goalJustReached: boolean;
};

export async function awardXp(uid: string, action: GameAction): Promise<AwardResult> {
  const gained = XP_REWARDS[action];
  const today = todayISO();

  return runTransaction(db, async (tx) => {
    const ref = statsRef(uid);
    const snap = await tx.get(ref);
    const before = normalize(snap.data());

    const xpByDate = { ...before.xpByDate };
    const todayBefore = xpByDate[today] ?? 0;
    xpByDate[today] = todayBefore + gained;

    const cutoff = addDaysISO(today, -MAX_HISTORY_DAYS);
    for (const date of Object.keys(xpByDate)) {
      if (date < cutoff) delete xpByDate[date];
    }

    const counterKey = COUNTER_BY_ACTION[action];
    const after: GameStats = {
      ...before,
      totalXp: before.totalXp + gained,
      xpByDate,
      counters: { ...before.counters, [counterKey]: before.counters[counterKey] + 1 },
    };

    const badgesAfter = earnedBadges(after);
    const newBadges = badgesAfter.filter((id) => !before.unlockedBadges.includes(id));
    after.unlockedBadges = Array.from(new Set([...before.unlockedBadges, ...badgesAfter]));

    tx.set(ref, after, { merge: true });

    const levelBefore = levelFromXp(before.totalXp);
    const levelAfter = levelFromXp(after.totalXp);

    return {
      xpGained: gained,
      totalXp: after.totalXp,
      leveledUpTo: levelAfter > levelBefore ? levelAfter : null,
      newBadges,
      goalJustReached:
        todayBefore < before.dailyGoal && xpByDate[today] >= before.dailyGoal,
    };
  });
}

export async function setDailyGoal(uid: string, dailyGoal: number) {
  await setDoc(statsRef(uid), { dailyGoal }, { merge: true });
}
