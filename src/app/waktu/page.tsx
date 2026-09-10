"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { addTask, deleteTask, subscribeTasks, updateTaskStatus } from "@/lib/waktu";
import type { NewTask, Task, TaskStatus } from "@/types/waktu";
import { todayISO } from "@/lib/format";
import DateStrip from "./components/DateStrip";
import TaskSummaryCard from "./components/TaskSummaryCard";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import { useT } from "@/lib/i18n";

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
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    for (const t of tasks) {
      if (t.status === "todo") todo++;
      else if (t.status === "in_progress") inProgress++;
      else done++;
      if (t.status !== "done" && t.dueDate < today) overdue++;
    }
    return { todo, inProgress, done, overdue };
  }, [tasks]);

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      if (t.status === "done") continue;
      map[t.dueDate] = (map[t.dueDate] ?? 0) + 1;
    }
    return map;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const list = showAll ? tasks : tasks.filter((t) => t.dueDate === selectedDate);
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "done" ? 1 : b.status === "done" ? -1 : 0;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, showAll, selectedDate]);

  async function handleAdd(data: NewTask) {
    if (!user) return;
    await addTask(user.uid, data);
  }

  async function handleCycleStatus(id: string, status: TaskStatus) {
    if (!user) return;
    await updateTaskStatus(user.uid, id, status);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteTask(user.uid, id);
  }

  return (
    <>
      <TopBar title={t("time.title")} subtitle={t("time.subtitle")} />

      <TaskSummaryCard todo={todo} inProgress={inProgress} done={done} overdue={overdue} />

      <div className="mt-5">
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
          <DateStrip selected={selectedDate} onSelect={setSelectedDate} countByDate={countByDate} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">
          {showAll ? t("time.allTasks") : t("time.todayTasks")}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
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
              {showAll ? t("time.emptyAll") : t("time.emptyDate")}
            </p>
          </div>
        )}

        {visibleTasks.map((task) => (
          <TaskCard key={task.id} task={task} onCycleStatus={handleCycleStatus} onDelete={handleDelete} />
        ))}
      </div>

      {showForm && (
        <TaskForm defaultDate={selectedDate} onSubmit={handleAdd} onClose={() => setShowForm(false)} />
      )}
    </>
  );
}
