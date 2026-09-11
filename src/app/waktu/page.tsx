"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addTask,
  deleteTask,
  deleteTasks,
  subscribeTasks,
  updateTask,
  updateTaskStatus,
} from "@/lib/waktu";
import type { NewTask, Task, TaskStatus } from "@/types/waktu";
import { isTimed } from "@/types/waktu";
import { currentMonthKey, formatDate, monthKeyOf, todayISO } from "@/lib/format";
import DateStrip from "./components/DateStrip";
import TaskSummaryCard from "./components/TaskSummaryCard";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import MonthCalendar from "./components/MonthCalendar";
import DayTimeline from "./components/DayTimeline";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { useT } from "@/lib/i18n";
import { awardXp } from "@/lib/gamification";
import { celebrate } from "@/lib/celebrate";

type View = "agenda" | "day" | "month";

const VIEWS: View[] = ["agenda", "day", "month"];

export default function WaktuPage() {
  return (
    <AppShell>
      <WaktuContent />
    </AppShell>
  );
}

function WaktuContent() {
  const { user } = useAuth();
  const t = useT();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("agenda");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState<{ initial: Task | null; time: string } | null>(null);
  const selection = useSelection();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTasks(user.uid, (items) => {
      setTasks(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const { todo, inProgress, done, overdue } = useMemo(() => {
    const today = todayISO();
    let todo = 0;
    let inProgress = 0;
    let done = 0;
    let overdue = 0;
    for (const task of tasks) {
      if (task.status === "todo") todo++;
      else if (task.status === "in_progress") inProgress++;
      else done++;
      if (task.status !== "done" && task.dueDate < today) overdue++;
    }
    return { todo, inProgress, done, overdue };
  }, [tasks]);

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.status === "done") continue;
      map[task.dueDate] = (map[task.dueDate] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  const dayTasks = useMemo(
    () => tasks.filter((task) => task.dueDate === selectedDate),
    [tasks, selectedDate]
  );

  const monthTasks = useMemo(
    () => tasks.filter((task) => monthKeyOf(task.dueDate) === monthKey),
    [tasks, monthKey]
  );

  const visibleTasks = useMemo(() => {
    const list = showAll ? tasks : dayTasks;
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "done" ? 1 : b.status === "done" ? -1 : 0;
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (!isTimed(a)) return isTimed(b) ? -1 : 0;
      if (!isTimed(b)) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [tasks, dayTasks, showAll]);

  // Picking a day in the month grid should also move the day view, and paging
  // the month should keep the grid and the header in sync.
  function selectDate(date: string) {
    setSelectedDate(date);
    setMonthKey(monthKeyOf(date));
  }

  async function handleSubmit(data: NewTask) {
    if (!user) return;
    if (form?.initial) await updateTask(user.uid, form.initial.id, data);
    else await addTask(user.uid, data);
  }

  async function handleCycleStatus(id: string, status: TaskStatus) {
    if (!user) return;
    await updateTaskStatus(user.uid, id, status);
    if (status === "done") celebrate(await awardXp(user.uid, "task"));
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteTask(user.uid, id);
  }

  async function handleBulkDelete(ids: string[]) {
    if (!user) return;
    await deleteTasks(user.uid, ids);
  }

  return (
    <>
      <TopBar title={t("time.title")} subtitle={t("time.subtitle")} />

      <TaskSummaryCard todo={todo} inProgress={inProgress} done={done} overdue={overdue} />

      <div className="mt-5 flex gap-1.5 px-5">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
              view === v ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`time.view.${v}`)}
          </button>
        ))}
      </div>

      {view === "month" && (
        <div className="mt-3">
          <MonthCalendar
            monthKey={monthKey}
            selected={selectedDate}
            tasks={monthTasks}
            onMonthChange={setMonthKey}
            onSelect={selectDate}
          />
        </div>
      )}

      {view === "day" && (
        <>
          <DateStrip selected={selectedDate} onSelect={selectDate} countByDate={countByDate} />
          <DayTimeline
            date={selectedDate}
            tasks={dayTasks}
            onSelectTask={(task) => setForm({ initial: task, time: "" })}
            onCreateAt={(time) => setForm({ initial: null, time })}
          />
        </>
      )}

      {view === "agenda" && (
        <div className="mt-3">
          <div className="flex items-center justify-between px-5">
            <h2 className="text-sm font-bold text-ink">{t("time.agenda")}</h2>
            <button
              onClick={() => setShowAll((v) => !v)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                showAll ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t("time.allTasks")}
            </button>
          </div>
          <div className={showAll ? "pointer-events-none opacity-40" : ""}>
            <DateStrip selected={selectedDate} onSelect={selectDate} countByDate={countByDate} />
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 px-5">
        <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
          {showAll && view === "agenda" ? t("time.allTasks") : formatDate(selectedDate)}
        </h2>
        <button
          onClick={() => (selection.active ? selection.stop() : selection.start())}
          className={`rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
            selection.active ? "bg-surface-raised text-ink" : "bg-surface-raised text-ink-muted"
          }`}
        >
          {selection.active ? t("app.cancel") : t("bulk.select")}
        </button>
        <button
          onClick={() => setForm({ initial: null, time: "" })}
          className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
        >
          {t("app.add")}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && visibleTasks.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">
              {showAll && view === "agenda" ? t("time.emptyAll") : t("time.emptyDate")}
            </p>
          </div>
        )}

        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onCycleStatus={handleCycleStatus}
            onOpen={(item) => setForm({ initial: item, time: "" })}
            selectMode={selection.active}
            selected={selection.isSelected(task.id)}
            onToggleSelect={selection.toggle}
            onLongPress={selection.start}
          />
        ))}
      </div>

      <SelectionBar
        selection={selection}
        allIds={visibleTasks.map((task) => task.id)}
        onDelete={handleBulkDelete}
      />

      {form && (
        <TaskForm
          defaultDate={selectedDate}
          defaultTime={form.time}
          initial={form.initial}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onClose={() => setForm(null)}
        />
      )}
    </>
  );
}
