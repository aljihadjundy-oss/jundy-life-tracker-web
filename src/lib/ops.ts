import { addDaysISO, todayISO } from "./format";
import {
  BOTTLENECK_DAYS,
  isOpen,
  STATUS_ORDER,
  type GroupBy,
  type Task,
  type TaskFilters,
  type TaskScope,
  type TaskStatus,
} from "@/types/waktu";

const DAY_MS = 24 * 60 * 60 * 1000;

export function applyScope(tasks: Task[], scope: TaskScope) {
  if (scope === "open") return tasks.filter((task) => isOpen(task.status));
  if (scope === "done") return tasks.filter((task) => task.status === "done");
  return tasks;
}

/** True when a task's due date falls inside the chosen range. */
function inDueRange(task: Task, filters: TaskFilters, today: string) {
  switch (filters.dueRange) {
    case "overdue":
      return isOpen(task.status) && task.dueDate < today;
    case "today":
      return task.dueDate === today;
    case "tomorrow":
      return task.dueDate === addDaysISO(today, 1);
    case "week":
      // Today through the next six days — the week you can still act on.
      return task.dueDate >= today && task.dueDate <= addDaysISO(today, 6);
    case "date":
      return filters.date === "" || task.dueDate === filters.date;
    default:
      return true;
  }
}

export function applyFilters(tasks: Task[], filters: TaskFilters) {
  const search = filters.search.trim().toLowerCase();
  const today = todayISO();
  return tasks.filter((task) => {
    if (!inDueRange(task, filters, today)) return false;
    if (filters.category && task.category !== filters.category) return false;
    if (filters.unit && task.unit !== filters.unit) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.owner && task.owner !== filters.owner) return false;
    if (search) {
      const haystack = `${task.title} ${task.note} ${task.owner}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** Every owner name currently in use, for the filter and strike screens. */
export function ownersOf(tasks: Task[]) {
  return [...new Set(tasks.map((task) => task.owner).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "id")
  );
}

export type TaskGroup = { key: string; tasks: Task[]; done: number };

export function groupTasks(tasks: Task[], groupBy: GroupBy, emptyLabel: string): TaskGroup[] {
  if (!groupBy) return [{ key: "", tasks, done: tasks.filter((t) => t.status === "done").length }];

  const field = groupBy === "category" ? "category" : groupBy;
  const buckets = new Map<string, Task[]>();
  for (const task of tasks) {
    const raw = task[field as keyof Task];
    const key = typeof raw === "string" && raw !== "" ? raw : emptyLabel;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(task);
    else buckets.set(key, [task]);
  }

  return [...buckets.entries()]
    .map(([key, items]) => ({
      key,
      tasks: items,
      done: items.filter((t) => t.status === "done").length,
    }))
    // Status groups read best in workflow order; everything else alphabetically.
    .sort((a, b) => {
      if (groupBy === "status") {
        return (
          STATUS_ORDER.indexOf(a.key as TaskStatus) - STATUS_ORDER.indexOf(b.key as TaskStatus)
        );
      }
      return a.key.localeCompare(b.key, "id");
    });
}

// ---------------------------------------------------------------------------
// Numbers for the stats row, the overview and the weekly review
// ---------------------------------------------------------------------------

export type OpsStats = {
  total: number;
  open: number;
  done: number;
  blocked: number;
  ghosted: number;
  doneThisWeek: number;
  completionRate: number;
  byStatus: Record<TaskStatus, number>;
};

export function opsStats(tasks: Task[]): OpsStats {
  const weekAgo = Date.now() - 7 * DAY_MS;
  const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<TaskStatus, number>;

  let open = 0;
  let doneThisWeek = 0;
  for (const task of tasks) {
    byStatus[task.status]++;
    if (isOpen(task.status)) open++;
    if (task.completedAt && task.completedAt >= weekAgo) doneThisWeek++;
  }

  const done = byStatus.done;
  return {
    total: tasks.length,
    open,
    done,
    blocked: byStatus.blocked,
    ghosted: byStatus.ghosted,
    doneThisWeek,
    completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0,
    byStatus,
  };
}

export type Breakdown = { key: string; total: number; done: number; byStatus: Record<TaskStatus, number> };

/** Per-unit or per-owner rollup for the stacked bars in the overview. */
export function breakdown(tasks: Task[], field: "unit" | "owner", emptyLabel: string): Breakdown[] {
  const buckets = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task[field] || emptyLabel;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(task);
    else buckets.set(key, [task]);
  }
  return [...buckets.entries()]
    .map(([key, items]) => {
      const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
        TaskStatus,
        number
      >;
      for (const task of items) byStatus[task.status]++;
      return { key, total: items.length, done: byStatus.done, byStatus };
    })
    .sort((a, b) => b.total - a.total);
}

/** Tasks stuck in progress or blocked for longer than BOTTLENECK_DAYS. */
export function bottlenecks(tasks: Task[]) {
  const cutoff = Date.now() - BOTTLENECK_DAYS * DAY_MS;
  return tasks.filter(
    (task) =>
      (task.status === "in_progress" || task.status === "blocked") && task.createdAt < cutoff
  );
}

export type WeeklyReview = {
  from: number;
  to: number;
  created: number;
  completed: number;
  rate: number;
  units: Breakdown[];
  bottlenecks: Task[];
};

export function weeklyReview(tasks: Task[], emptyLabel: string): WeeklyReview {
  const to = Date.now();
  const from = to - 7 * DAY_MS;
  const created = tasks.filter((task) => task.createdAt >= from).length;
  const completed = tasks.filter((task) => task.completedAt && task.completedAt >= from).length;
  return {
    from,
    to,
    created,
    completed,
    // Against what was opened this week, so a quiet week doesn't read as 0%.
    rate: created > 0 ? Math.round((completed / created) * 100) : 0,
    units: breakdown(tasks, "unit", emptyLabel),
    bottlenecks: bottlenecks(tasks),
  };
}
