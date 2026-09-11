"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addTask,
  addTasksBatch,
  cycleStrike,
  deleteTask,
  deleteTasks,
  subscribeTasks,
  subscribeWaktuSettings,
  updateTask,
  updateTaskStatus,
  updateTaskStatuses,
} from "@/lib/waktu";
import type { GroupBy, NewTask, Task, TaskScope, TaskStatus } from "@/types/waktu";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_WAKTU_SETTINGS,
  EMPTY_FILTERS,
  GROUP_BY_ORDER,
  hasActiveFilter,
  isTimed,
  SCOPE_ORDER,
  type TaskFilters,
  type WaktuSettings,
} from "@/types/waktu";
import { applyFilters, applyScope, groupTasks, opsStats, ownersOf } from "@/lib/ops";
import { parseTaskLines, toNewTasks } from "@/lib/import-tasks";
import { tasksToCsv, downloadCsv } from "@/lib/export-tasks";
import { currentMonthKey, formatDate, monthKeyOf, todayISO } from "@/lib/format";
import DateStrip from "./components/DateStrip";
import TaskCard from "./components/TaskCard";
import TaskForm from "./components/TaskForm";
import MonthCalendar from "./components/MonthCalendar";
import DayTimeline from "./components/DayTimeline";
import OpsStatsRow from "./components/OpsStatsRow";
import QuickAdd from "./components/QuickAdd";
import FilterSheet from "./components/FilterSheet";
import GroupHeader from "./components/GroupHeader";
import DueFilterRow from "./components/DueFilterRow";
import BulkStatusPicker from "./components/BulkStatusPicker";
import OverviewSheet from "./components/OverviewSheet";
import StrikeSheet from "./components/StrikeSheet";
import WeeklyReviewSheet from "./components/WeeklyReviewSheet";
import ImportSheet from "./components/ImportSheet";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { useT } from "@/lib/i18n";
import { awardXpInBackground } from "@/lib/gamification";

type View = "list" | "day" | "month";

const VIEWS: View[] = ["list", "day", "month"];

type Sheet = "overview" | "strikes" | "review" | "import" | "filter" | null;

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
  const [settings, setSettings] = useState<WaktuSettings>(DEFAULT_WAKTU_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [scope, setScope] = useState<TaskScope>("open");
  const [groupBy, setGroupBy] = useState<GroupBy>("");
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [form, setForm] = useState<{ initial: Task | null; time: string } | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const selection = useSelection();

  useEffect(() => {
    if (!user) return;
    const unsubTasks = subscribeTasks(user.uid, (items) => {
      setTasks(items);
      setLoading(false);
    });
    const unsubSettings = subscribeWaktuSettings(user.uid, setSettings);
    return () => {
      unsubTasks();
      unsubSettings();
    };
  }, [user]);

  const stats = useMemo(() => opsStats(tasks), [tasks]);
  const owners = useMemo(() => ownersOf(tasks), [tasks]);
  const strikeOwners = useMemo(
    () => Object.values(settings.strikes).filter((count) => count > 0).length,
    [settings.strikes]
  );

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const task of tasks) {
      if (task.status === "done" || task.status === "ghosted") continue;
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

  // The list view answers "what's on my plate", so it spans every date and is
  // narrowed by scope, filters and grouping instead of by the day strip.
  const listTasks = useMemo(() => {
    const scoped = applyScope(tasks, scope);
    const filtered = applyFilters(scoped, filters);
    return [...filtered].sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (!isTimed(a)) return isTimed(b) ? -1 : 0;
      if (!isTimed(b)) return 1;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [tasks, scope, filters]);

  const groups = useMemo(() => {
    const emptyLabel = groupBy === "owner" ? t("ops.noOwner") : t("ops.noUnit");
    return groupTasks(listTasks, groupBy, emptyLabel);
  }, [listTasks, groupBy, t]);

  function selectDate(date: string) {
    setSelectedDate(date);
    setMonthKey(monthKeyOf(date));
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  async function handleSubmit(data: NewTask) {
    if (!user) return;
    if (form?.initial) await updateTask(user.uid, form.initial.id, data);
    else await addTask(user.uid, data);
  }

  /** Quick add understands the same @owner #unit ^date tags as the importer. */
  async function handleQuickAdd(line: string) {
    if (!user) return;
    const [parsed] = parseTaskLines(line, settings.units);
    const base: NewTask = parsed
      ? toNewTasks([parsed], "manual")[0]
      : {
          title: line,
          note: "",
          dueDate: selectedDate,
          startTime: "",
          durationMinutes: DEFAULT_DURATION_MINUTES,
          reminderMinutes: 0,
          status: "todo",
          category: "personal",
          owner: "",
          unit: "",
          link: "",
          source: "manual",
        };
    await addTask(user.uid, base);
  }

  async function handleCycleStatus(id: string, status: TaskStatus) {
    if (!user) return;
    await updateTaskStatus(user.uid, id, status);
    if (status === "done") awardXpInBackground(user.uid, "task");
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteTask(user.uid, id);
  }

  async function handleBulkDelete(ids: string[]) {
    if (!user) return;
    await deleteTasks(user.uid, ids);
  }

  async function handleBulkStatus(status: TaskStatus) {
    if (!user || selection.ids.length === 0) return;
    await updateTaskStatuses(user.uid, selection.ids, status);
    selection.stop();
  }

  async function handleImport(newTasks: NewTask[]) {
    if (!user) return;
    await addTasksBatch(user.uid, newTasks);
  }

  function handleExport() {
    const csv = tasksToCsv(tasks, settings.strikes, t);
    downloadCsv(`andropid-tasks_${todayISO()}.csv`, csv);
  }

  return (
    <>
      <TopBar
        title={t("time.title")}
        subtitle={t("time.subtitle")}
        extra={
          <button
            onClick={() => setSheet("overview")}
            className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink transition active:scale-95"
          >
            {t("ops.overview")}
          </button>
        }
      />

      <div className="mt-4">
        <OpsStatsRow
          stats={stats}
          strikeOwners={strikeOwners}
          onOpenStrikes={() => setSheet("strikes")}
        />
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
        <ToolButton onClick={() => setSheet("import")}>{t("ops.import")}</ToolButton>
        <ToolButton onClick={() => setSheet("strikes")}>{t("ops.strikeTracker")}</ToolButton>
        <ToolButton onClick={() => setSheet("review")}>{t("ops.weeklyReview")}</ToolButton>
        <ToolButton onClick={handleExport}>{t("ops.exportCsv")}</ToolButton>
      </div>

      <div className="mt-4 flex gap-1.5 px-5">
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

      {view === "list" && (
        <>
          <div className="mt-4 flex gap-1.5 px-5">
            {SCOPE_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  scope === s ? "bg-accent-time text-white" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t(`ops.scope.${s}`)}
              </button>
            ))}
          </div>

          <div className="mt-2.5">
            <DueFilterRow filters={filters} onChange={setFilters} />
          </div>

          <div className="mt-2.5 flex items-center gap-2 px-5">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-raised px-3 py-2">
              <span className="text-xs text-ink-muted">🔎</span>
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder={t("ops.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
            </label>
            <button
              onClick={() => setSheet("filter")}
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition active:scale-95 ${
                hasActiveFilter({ ...filters, search: "" })
                  ? "bg-accent-time text-white"
                  : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t("ops.filter")}
            </button>
          </div>

          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto px-5">
            <span className="shrink-0 self-center pr-1 text-[11px] font-semibold text-ink-muted">
              {t("ops.groupBy")}
            </span>
            {GROUP_BY_ORDER.map((g) => (
              <button
                key={g || "none"}
                onClick={() => {
                  setGroupBy(g);
                  setCollapsed([]);
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                  groupBy === g ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                }`}
              >
                {t(`ops.group.${g || "none"}`)}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <QuickAdd onAdd={handleQuickAdd} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 px-5">
            <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
              {t("ops.taskCount", { count: listTasks.length })}
            </h2>
            <button
              onClick={() => (selection.active ? selection.stop() : selection.start())}
              className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
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

          <div className="mt-3 flex flex-col gap-2.5 px-5 pb-24">
            {loading && (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
              </div>
            )}

            {!loading && listTasks.length === 0 && (
              <div className="rounded-2xl bg-surface-raised p-8 text-center">
                <p className="text-sm text-ink-muted">{t("time.emptyAll")}</p>
              </div>
            )}

            {groups.map((group) => (
              <div key={group.key || "all"} className="flex flex-col gap-2.5">
                {groupBy && (
                  <GroupHeader
                    label={
                      groupBy === "status"
                        ? t(`status.${group.key}`)
                        : groupBy === "category"
                          ? t(`category.task.${group.key}`)
                          : group.key
                    }
                    done={group.done}
                    total={group.tasks.length}
                    collapsed={collapsed.includes(group.key)}
                    onToggle={() => toggleGroup(group.key)}
                  />
                )}

                {!collapsed.includes(group.key) &&
                  group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      strikes={task.owner ? (settings.strikes[task.owner] ?? 0) : 0}
                      onCycleStatus={handleCycleStatus}
                      onOpen={(item) => setForm({ initial: item, time: "" })}
                      selectMode={selection.active}
                      selected={selection.isSelected(task.id)}
                      onToggleSelect={selection.toggle}
                      onLongPress={selection.start}
                    />
                  ))}
              </div>
            ))}
          </div>
        </>
      )}

      {view !== "list" && (
        <div className="mt-4 flex items-center justify-between gap-2 px-5 pb-6">
          <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
            {formatDate(selectedDate)}
          </h2>
          <button
            onClick={() => setForm({ initial: null, time: "" })}
            className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
          >
            {t("app.add")}
          </button>
        </div>
      )}

      <SelectionBar
        selection={selection}
        allIds={listTasks.map((task) => task.id)}
        onDelete={handleBulkDelete}
        extra={<BulkStatusPicker onPick={(status) => void handleBulkStatus(status)} />}
      />

      {form && (
        <TaskForm
          defaultDate={selectedDate}
          defaultTime={form.time}
          initial={form.initial}
          units={settings.units}
          owners={owners}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          onClose={() => setForm(null)}
        />
      )}

      {sheet === "filter" && (
        <FilterSheet
          filters={filters}
          units={settings.units}
          owners={owners}
          onChange={setFilters}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "overview" && (
        <OverviewSheet tasks={tasks} strikes={settings.strikes} onClose={() => setSheet(null)} />
      )}
      {sheet === "strikes" && (
        <StrikeSheet
          tasks={tasks}
          strikes={settings.strikes}
          onCycle={(owner, current) => {
            if (user) void cycleStrike(user.uid, owner, current);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "review" && (
        <WeeklyReviewSheet tasks={tasks} strikes={settings.strikes} onClose={() => setSheet(null)} />
      )}
      {sheet === "import" && (
        <ImportSheet units={settings.units} onImport={handleImport} onClose={() => setSheet(null)} />
      )}
    </>
  );
}

function ToolButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full bg-surface-card px-3.5 py-2 text-xs font-semibold text-ink ring-1 ring-border/60 transition active:scale-95"
    >
      {children}
    </button>
  );
}
