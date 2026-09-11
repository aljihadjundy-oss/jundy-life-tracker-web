/**
 * Statuses follow the ops tracker: "todo" is Not Started, and Blocked and
 * Ghosted are distinct outcomes — Blocked means waiting on someone, Ghosted
 * means the owner went quiet. Keeping them apart is the whole point of the
 * strike system below.
 */
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "ghosted";

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "blocked", "done", "ghosted"];

/** The order the checkbox cycles through — the two dead-end states stay out. */
const CYCLE: TaskStatus[] = ["todo", "in_progress", "done"];

export function nextStatus(status: TaskStatus): TaskStatus {
  const idx = CYCLE.indexOf(status);
  if (idx === -1) return "todo";
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function isOpen(status: TaskStatus) {
  return status !== "done" && status !== "ghosted";
}

export type TaskCategory = "personal" | "delegation" | "crossbu";

export const CATEGORY_ORDER: TaskCategory[] = ["personal", "delegation", "crossbu"];

/** Where a task came from, so imported batches stay traceable. */
export type TaskSource = "manual" | "minutes" | "import";

export type Task = {
  id: string;
  title: string;
  note: string;
  dueDate: string; // ISO date (yyyy-mm-dd)
  /** "HH:mm" in the user's local time, or "" for an all-day task. */
  startTime: string;
  /** Length of the block on the calendar. Ignored when startTime is "". */
  durationMinutes: number;
  /** Minutes before startTime to push a reminder. 0 turns the reminder off. */
  reminderMinutes: number;
  status: TaskStatus;
  category: TaskCategory;
  /** Person accountable. Free text so a new name never needs a settings trip. */
  owner: string;
  /** Business unit. One of the names in settings/waktu, or "". */
  unit: string;
  link: string;
  source: TaskSource;
  createdAt: number; // epoch millis
  /** Set the first time the task reaches Done, cleared when it moves back. */
  completedAt: number | null;
};

export type NewTask = Omit<Task, "id" | "createdAt" | "completedAt">;

export const DEFAULT_DURATION_MINUTES = 60;
export const DEFAULT_REMINDER_MINUTES = 30;

/** Lead times offered in the form. 0 means "no reminder". */
export const REMINDER_OPTIONS = [0, 10, 30, 60] as const;

export const DURATION_OPTIONS = [15, 30, 60, 90, 120] as const;

/** Calendar colour per status, used by the day/month grid. */
export const TASK_COLOR: Record<TaskStatus, string> = {
  todo: "#98A2B3",
  in_progress: "var(--color-accent-time)",
  blocked: "#f79009",
  done: "var(--color-accent-finance)",
  ghosted: "#f04438",
};

export function isTimed(task: Pick<Task, "startTime">) {
  return /^\d{2}:\d{2}$/.test(task.startTime);
}

// ---------------------------------------------------------------------------
// Module settings (users/{uid}/settings/waktu)
// ---------------------------------------------------------------------------

/**
 * Business units are company-specific, so they live in Firestore and are
 * editable from the settings page. These are only the seed values.
 */
export const DEFAULT_UNITS = [
  "Sinatif Agency",
  "Sinatif Academy",
  "Osiris Event",
  "Hexolution",
  "Bedadikit.id",
  "Internal",
];

/** Three strikes and the delegation is cut off. */
export const MAX_STRIKES = 3;

export type WaktuSettings = {
  units: string[];
  /** Strike count per owner name, 0–MAX_STRIKES. */
  strikes: Record<string, number>;
};

export const DEFAULT_WAKTU_SETTINGS: WaktuSettings = {
  units: DEFAULT_UNITS,
  strikes: {},
};

/** A task counts as a bottleneck once it has sat open this long. */
export const BOTTLENECK_DAYS = 7;

export type GroupBy = "" | "unit" | "owner" | "status" | "category";

export const GROUP_BY_ORDER: GroupBy[] = ["", "unit", "owner", "status", "category"];

export type TaskScope = "open" | "all" | "done";

export const SCOPE_ORDER: TaskScope[] = ["open", "all", "done"];

export type TaskFilters = {
  category: TaskCategory | "";
  unit: string;
  status: TaskStatus | "";
  owner: string;
  search: string;
};

export const EMPTY_FILTERS: TaskFilters = {
  category: "",
  unit: "",
  status: "",
  owner: "",
  search: "",
};

export function hasActiveFilter(filters: TaskFilters) {
  return Object.values(filters).some((value) => value !== "");
}
