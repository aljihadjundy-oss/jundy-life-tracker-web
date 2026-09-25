export type GameAction =
  | "transaction"
  | "task"
  | "habit"
  | "journal"
  | "post"
  | "water"
  | "meal"
  | "sleep"
  | "exercise";

/**
 * Every pillar should give a user who only enables that one pillar the same
 * shot at a daily goal as someone running all five — before this, Kesehatan's
 * only XP source was the generic habit checklist, so someone diligently
 * logging water/meals/sleep/exercise (its actual daily-use data) earned
 * nothing for it while every other pillar's normal usage paid XP. Water and
 * meals are capped at once per real event (see awardXp guards in
 * lib/gamification.ts) so they sit at the low end near `transaction`; sleep
 * and exercise are once-per-session like `habit`.
 */
export const XP_REWARDS: Record<GameAction, number> = {
  transaction: 5,
  task: 15,
  habit: 10,
  journal: 20,
  post: 25,
  water: 5,
  meal: 5,
  sleep: 10,
  exercise: 10,
};

export type GameCounters = {
  transactions: number;
  tasksDone: number;
  habitsChecked: number;
  journalEntries: number;
  postsPublished: number;
  waterLogged: number;
  mealsLogged: number;
  sleepLogged: number;
  exerciseLogged: number;
};

export type GameStats = {
  totalXp: number;
  dailyGoal: number;
  xpByDate: Record<string, number>;
  unlockedBadges: string[];
  counters: GameCounters;
};

export const EMPTY_STATS: GameStats = {
  totalXp: 0,
  dailyGoal: 50,
  xpByDate: {},
  unlockedBadges: [],
  counters: {
    transactions: 0,
    tasksDone: 0,
    habitsChecked: 0,
    journalEntries: 0,
    postsPublished: 0,
    waterLogged: 0,
    mealsLogged: 0,
    sleepLogged: 0,
    exerciseLogged: 0,
  },
};

export const DAILY_GOAL_OPTIONS = [20, 50, 100, 200];

export type Badge = {
  id: string;
  emoji: string;
  /** Evaluated against live stats to decide whether the badge is earned. */
  earned: (ctx: { stats: GameStats; level: number; streak: number }) => boolean;
};

export const BADGES: Badge[] = [
  { id: "first_step", emoji: "🌱", earned: ({ stats }) => stats.totalXp >= 1 },
  { id: "level_5", emoji: "⭐", earned: ({ level }) => level >= 5 },
  { id: "level_10", emoji: "🌟", earned: ({ level }) => level >= 10 },
  { id: "streak_7", emoji: "🔥", earned: ({ streak }) => streak >= 7 },
  { id: "streak_30", emoji: "💎", earned: ({ streak }) => streak >= 30 },
  { id: "money_10", emoji: "💰", earned: ({ stats }) => stats.counters.transactions >= 10 },
  { id: "money_100", emoji: "🏦", earned: ({ stats }) => stats.counters.transactions >= 100 },
  { id: "task_25", emoji: "✅", earned: ({ stats }) => stats.counters.tasksDone >= 25 },
  { id: "habit_50", emoji: "❤️", earned: ({ stats }) => stats.counters.habitsChecked >= 50 },
  { id: "journal_10", emoji: "📓", earned: ({ stats }) => stats.counters.journalEntries >= 10 },
  { id: "post_20", emoji: "✨", earned: ({ stats }) => stats.counters.postsPublished >= 20 },
];

// Level curve: level L starts at 50 * L * (L - 1) XP.
// L1 = 0, L2 = 100, L3 = 300, L4 = 600, L5 = 1000, ...
export function xpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelFromXp(totalXp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    into: totalXp - start,
    needed: next - start,
    ratio: (totalXp - start) / (next - start),
  };
}
