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

export type DailyMetrics = {
  date: string; // ISO date (yyyy-mm-dd)
  sleepHours: number;
  exerciseMinutes: number;
  waterGlasses: number;
};
