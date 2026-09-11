"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addHabit,
  deleteHabit,
  deleteHabits,
  setHabitLog,
  setMetrics,
  subscribeHabitLogs,
  subscribeHabits,
  subscribeMetrics,
} from "@/lib/kesehatan";
import type { DailyMetrics, Habit, HabitLog, NewHabit } from "@/types/kesehatan";
import { addDaysISO, todayISO } from "@/lib/format";
import HealthSummaryCard from "./components/HealthSummaryCard";
import DayPicker from "./components/DayPicker";
import MetricsCard from "./components/MetricsCard";
import MetricsForm from "./components/MetricsForm";
import HabitCard from "./components/HabitCard";
import HabitForm from "./components/HabitForm";
import { useT } from "@/lib/i18n";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { awardXp } from "@/lib/gamification";
import { celebrate } from "@/lib/celebrate";

export default function KesehatanPage() {
  return (
    <AppShell>
      <KesehatanContent />
    </AppShell>
  );
}

function KesehatanContent() {
  const { user } = useAuth();
  const t = useT();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [metricsList, setMetricsList] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const selection = useSelection();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubHabits = subscribeHabits(user.uid, (items) => {
      setHabits(items);
      setLoading(false);
    });
    const unsubLogs = subscribeHabitLogs(user.uid, setLogs);
    const unsubMetrics = subscribeMetrics(user.uid, setMetricsList);
    return () => {
      unsubHabits();
      unsubLogs();
      unsubMetrics();
    };
  }, [user]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const log of logs) {
      if (!map.has(log.date)) map.set(log.date, new Set());
      map.get(log.date)!.add(log.habitId);
    }
    return map;
  }, [logs]);

  const isDateComplete = useMemo(
    () => (date: string) => {
      if (habits.length === 0) return false;
      const ids = logsByDate.get(date);
      return !!ids && habits.every((h) => ids.has(h.id));
    },
    [habits, logsByDate]
  );

  const completeDates = useMemo(() => {
    const set = new Set<string>();
    for (const date of logsByDate.keys()) {
      if (isDateComplete(date)) set.add(date);
    }
    return set;
  }, [logsByDate, isDateComplete]);

  const streak = useMemo(() => {
    const today = todayISO();
    let streak = 0;
    for (let i = 0; ; i++) {
      const date = addDaysISO(today, -i);
      if (isDateComplete(date)) streak++;
      else break;
    }
    return streak;
  }, [isDateComplete]);

  const doneToday = useMemo(() => {
    const ids = logsByDate.get(todayISO());
    if (!ids) return 0;
    return habits.filter((h) => ids.has(h.id)).length;
  }, [habits, logsByDate]);

  const selectedCompletedIds = logsByDate.get(selectedDate) ?? new Set<string>();
  const selectedMetrics = metricsList.find((m) => m.date === selectedDate) ?? null;

  async function handleAddHabit(data: NewHabit) {
    if (!user) return;
    await addHabit(user.uid, data);
  }

  async function handleDeleteHabit(id: string) {
    if (!user) return;
    await deleteHabit(user.uid, id);
  }

  async function handleBulkDeleteHabits(ids: string[]) {
    if (!user) return;
    await deleteHabits(user.uid, ids);
  }

  async function handleToggleHabit(habitId: string, next: boolean) {
    if (!user) return;
    await setHabitLog(user.uid, habitId, selectedDate, next);
    if (next) celebrate(await awardXp(user.uid, "habit"));
  }

  async function handleSaveMetrics(data: DailyMetrics) {
    if (!user) return;
    await setMetrics(user.uid, data);
  }

  return (
    <>
      <TopBar title={t("health.title")} subtitle={t("health.subtitle")} />

      <HealthSummaryCard streak={streak} doneToday={doneToday} totalHabits={habits.length} />

      <div className="mt-5">
        <h2 className="px-5 text-sm font-bold text-ink">{t("health.history")}</h2>
        <DayPicker selected={selectedDate} onSelect={setSelectedDate} completeDates={completeDates} />
      </div>

      <div className="mt-1">
        <MetricsCard metrics={selectedMetrics} onEdit={() => setShowMetricsForm(true)} />
      </div>

      <div className="mt-5 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("health.habitChecklist")}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => (selection.active ? selection.stop() : selection.start())}
            className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
          >
            {selection.active ? t("app.cancel") : t("bulk.select")}
          </button>
          <button
            onClick={() => setShowHabitForm(true)}
            className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
          >
            {t("app.add")}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && habits.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">{t("health.empty")}</p>
          </div>
        )}

        {habits.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            completed={selectedCompletedIds.has(h.id)}
            onToggle={handleToggleHabit}
            onDelete={handleDeleteHabit}
            selectMode={selection.active}
            selected={selection.isSelected(h.id)}
            onToggleSelect={selection.toggle}
            onLongPress={selection.start}
          />
        ))}
      </div>

      <SelectionBar
        selection={selection}
        allIds={habits.map((h) => h.id)}
        onDelete={handleBulkDeleteHabits}
      />

      {showHabitForm && <HabitForm onSubmit={handleAddHabit} onClose={() => setShowHabitForm(false)} />}
      {showMetricsForm && (
        <MetricsForm
          date={selectedDate}
          initial={selectedMetrics}
          onSubmit={handleSaveMetrics}
          onClose={() => setShowMetricsForm(false)}
        />
      )}
    </>
  );
}
