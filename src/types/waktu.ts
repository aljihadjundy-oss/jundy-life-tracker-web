export type TaskStatus = "todo" | "in_progress" | "done";

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
  createdAt: number; // epoch millis
};

export type NewTask = Omit<Task, "id" | "createdAt">;

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

export function nextStatus(status: TaskStatus): TaskStatus {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export const DEFAULT_DURATION_MINUTES = 60;
export const DEFAULT_REMINDER_MINUTES = 30;

/** Lead times offered in the form. 0 means "no reminder". */
export const REMINDER_OPTIONS = [0, 10, 30, 60] as const;

export const DURATION_OPTIONS = [15, 30, 60, 90, 120] as const;

/** Calendar colour per status, used by the day/week grid. */
export const TASK_COLOR: Record<TaskStatus, string> = {
  todo: "var(--color-accent-time)",
  in_progress: "var(--color-accent-branding)",
  done: "var(--color-accent-finance)",
};

export function isTimed(task: Pick<Task, "startTime">) {
  return /^\d{2}:\d{2}$/.test(task.startTime);
}
