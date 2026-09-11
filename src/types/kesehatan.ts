export type Habit = {
  id: string;
  name: string;
  createdAt: number; // epoch millis
};

export type NewHabit = Omit<Habit, "id" | "createdAt">;

export type HabitLog = {
  habitId: string;
  date: string; // ISO date (yyyy-mm-dd)
};

export type ExerciseLog = {
  /** Slug of a suggestion from EXERCISE_BANK, or a free-form name. */
  name: string;
  minutes: number;
};

/**
 * One document per day at users/{uid}/metrics/{date}. The original three
 * numbers stay so old documents keep rendering; everything added for the
 * Rima-style tracking is optional and defaults on read.
 */
export type DailyMetrics = {
  date: string; // ISO date (yyyy-mm-dd)
  sleepHours: number;
  exerciseMinutes: number;
  waterGlasses: number;
  /** 0 = not logged today, otherwise 1–5. */
  energy: number;
  /** Mood slug, "" when not logged. */
  mood: string;
  /** Symptom slugs. */
  symptoms: string[];
  /** Names of the scheduled meals already eaten. */
  mealsDone: string[];
  exercise: ExerciseLog[];
};

export const EMPTY_METRICS = (date: string): DailyMetrics => ({
  date,
  sleepHours: 0,
  exerciseMinutes: 0,
  waterGlasses: 0,
  energy: 0,
  mood: "",
  symptoms: [],
  mealsDone: [],
  exercise: [],
});

// ---------------------------------------------------------------------------
// Body mode & cycle
// ---------------------------------------------------------------------------

/**
 * "none" is the mode for someone who doesn't track a cycle. It is the default
 * unless the profile says otherwise — a cycle tracker has no business showing
 * up for a user who has no use for one.
 */
export type BodyMode = "none" | "cycle" | "pregnant" | "breastfeeding";

export const BODY_MODES: BodyMode[] = ["none", "cycle", "pregnant", "breastfeeding"];

export type Meal = {
  /** Slug used as the identifier in DailyMetrics.mealsDone. */
  id: string;
  time: string; // "HH:mm"
};

export type ExercisePrefs = {
  types: string[];
  frequency: "low" | "mid" | "high";
  level: "beginner" | "intermediate" | "regular";
  activity: "sitting" | "standing" | "lifting";
};

export type HealthSettings = {
  bodyMode: BodyMode;
  /** True once the user has picked a mode, so the profile default stops applying. */
  bodyModeSet: boolean;
  /** First day of the most recent period. */
  cycleStart: string;
  cycleLength: number;
  periodLength: number;
  /** Estimated due date, used in pregnancy mode. */
  dueDate: string;
  /** Glasses per day before any mode adjustment. */
  waterTarget: number;
  meals: Meal[];
  bedtime: string; // "HH:mm"
  wakeTime: string; // "HH:mm"
  exercisePrefs: ExercisePrefs;
};

export const CYCLE_LENGTH_OPTIONS = [21, 24, 26, 28, 30, 32, 35];
export const PERIOD_LENGTH_OPTIONS = [3, 4, 5, 6, 7, 8];
export const WATER_TARGET_OPTIONS = [6, 8, 10, 12];

export const EXERCISE_TYPES = [
  "gym",
  "calisthenics",
  "weights",
  "running",
  "cycling",
  "swimming",
  "futsal",
  "basketball",
  "badminton",
  "boxing",
  "martialArts",
  "hiking",
  "walking",
  "yoga",
  "pilates",
  "zumba",
];

export const MOODS = ["calm", "happy", "neutral", "anxious", "sad", "irritable"];

export const CYCLE_SYMPTOMS = [
  "mildCramps",
  "badCramps",
  "headache",
  "bloating",
  "lowMood",
  "acne",
  "breastPain",
  "tired",
];

export const PREGNANCY_SYMPTOMS = [
  "nausea",
  "heartburn",
  "swollenFeet",
  "backPain",
  "insomnia",
  "babyKicks",
];

export const DEFAULT_HEALTH_SETTINGS: HealthSettings = {
  bodyMode: "none",
  bodyModeSet: false,
  cycleStart: "",
  cycleLength: 28,
  periodLength: 5,
  dueDate: "",
  waterTarget: 8,
  meals: [
    { id: "breakfast", time: "07:30" },
    { id: "lunch", time: "12:30" },
    { id: "snack", time: "16:00" },
    { id: "dinner", time: "19:00" },
  ],
  bedtime: "23:00",
  wakeTime: "06:30",
  exercisePrefs: {
    types: ["walking"],
    frequency: "mid",
    level: "beginner",
    activity: "sitting",
  },
};
