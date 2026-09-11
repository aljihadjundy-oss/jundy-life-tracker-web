"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addHabit,
  deleteHabit,
  deleteHabits,
  patchMetrics,
  saveHealthSettings,
  setHabitLog,
  subscribeHabitLogs,
  subscribeHabits,
  subscribeHealthSettings,
  subscribeMetrics,
} from "@/lib/kesehatan";
import {
  DEFAULT_HEALTH_SETTINGS,
  EMPTY_METRICS,
  type DailyMetrics,
  type ExerciseLog,
  type Habit,
  type HabitLog,
  type HealthSettings,
  type NewHabit,
} from "@/types/kesehatan";
import { cycleInfo, sleepHours, suggestions, waterTarget } from "@/lib/cycle";
import { addDaysISO, currentMonthKey, todayISO } from "@/lib/format";
import HealthSummaryCard from "./components/HealthSummaryCard";
import DayPicker from "./components/DayPicker";
import DaySummaryCard from "./components/DaySummaryCard";
import HabitCard from "./components/HabitCard";
import HabitForm from "./components/HabitForm";
import BodyModeCard from "./components/BodyModeCard";
import CycleCalendar from "./components/CycleCalendar";
import WaterCard from "./components/WaterCard";
import MealsCard from "./components/MealsCard";
import SleepCard from "./components/SleepCard";
import EnergyMoodCard from "./components/EnergyMoodCard";
import SymptomsCard from "./components/SymptomsCard";
import ExerciseCard from "./components/ExerciseCard";
import HealthSettingsSheet from "./components/HealthSettingsSheet";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { useT } from "@/lib/i18n";
import { useUserConfig } from "@/lib/user-context";
import { cycleRelevantByDefault } from "@/types/profile";
import { awardXpInBackground } from "@/lib/gamification";

type Tab = "today" | "body" | "habits";

const TABS: Tab[] = ["today", "body", "habits"];

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
  const { profile } = useUserConfig();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [metricsList, setMetricsList] = useState<DailyMetrics[]>([]);
  const [settings, setSettings] = useState<HealthSettings>(DEFAULT_HEALTH_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("today");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const selection = useSelection();

  useEffect(() => {
    if (!user) return;
    const unsubHabits = subscribeHabits(user.uid, (items) => {
      setHabits(items);
      setLoading(false);
    });
    const unsubLogs = subscribeHabitLogs(user.uid, setLogs);
    const unsubMetrics = subscribeMetrics(user.uid, setMetricsList);
    const unsubSettings = subscribeHealthSettings(user.uid, setSettings);
    return () => {
      unsubHabits();
      unsubLogs();
      unsubMetrics();
      unsubSettings();
    };
  }, [user]);

  // Until the user picks a mode explicitly, it follows the profile.
  const bodyMode = settings.bodyModeSet
    ? settings.bodyMode
    : cycleRelevantByDefault(profile)
      ? "cycle"
      : "none";
  const effectiveSettings = useMemo(
    () => ({ ...settings, bodyMode }),
    [settings, bodyMode]
  );
  const tracksCycle = bodyMode === "cycle";

  const metricsByDate = useMemo(() => {
    const map = new Map<string, DailyMetrics>();
    for (const m of metricsList) map.set(m.date, m);
    return map;
  }, [metricsList]);

  const today = todayISO();
  const todayMetrics = metricsByDate.get(today) ?? EMPTY_METRICS(today);
  const selectedMetrics = metricsByDate.get(selectedDate) ?? null;

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
    let streak = 0;
    for (let i = 0; ; i++) {
      if (isDateComplete(addDaysISO(today, -i))) streak++;
      else break;
    }
    return streak;
  }, [isDateComplete, today]);

  const doneToday = useMemo(() => {
    const ids = logsByDate.get(today);
    if (!ids) return 0;
    return habits.filter((h) => ids.has(h.id)).length;
  }, [habits, logsByDate, today]);

  const energyWeek = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const entry = metricsByDate.get(addDaysISO(today, i - 6));
        return entry && entry.energy > 0 ? entry.energy : null;
      }),
    [metricsByDate, today]
  );

  const phase =
    tracksCycle && settings.cycleStart ? cycleInfo(effectiveSettings, today).phase : "follicular";
  const movement = useMemo(
    () => suggestions(bodyMode, phase, settings.exercisePrefs),
    [bodyMode, phase, settings.exercisePrefs]
  );

  const movementHeading = tracksCycle
    ? t("health.movementForPhase", { phase: t(`health.phase.${phase}`).toLowerCase() })
    : t(`health.movementFor.${bodyMode}`);

  const selectedCompletedIds = logsByDate.get(selectedDate) ?? new Set<string>();
  const target = waterTarget(effectiveSettings);

  function patchToday(patch: Partial<DailyMetrics>) {
    if (!user) return;
    void patchMetrics(user.uid, today, patch);
  }

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
    if (next) awardXpInBackground(user.uid, "habit");
  }

  async function handleSaveSettings(patch: Partial<HealthSettings>) {
    if (!user) return;
    await saveHealthSettings(user.uid, patch);
  }

  function logExercise(entry: ExerciseLog) {
    patchToday({
      exercise: [...todayMetrics.exercise, entry],
      exerciseMinutes: todayMetrics.exerciseMinutes + entry.minutes,
    });
  }

  return (
    <>
      <TopBar
        title={t("health.title")}
        subtitle={t("health.subtitle")}
        extra={
          <button
            onClick={() => setShowSettings(true)}
            aria-label={t("health.openSettings")}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-base transition active:scale-90"
          >
            ⚙️
          </button>
        }
      />

      <div className="mt-4 flex gap-1.5 px-5">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
              tab === item ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {t(`health.tab.${item}`)}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="mt-4 flex flex-col gap-4 pb-6">
          <HealthSummaryCard streak={streak} doneToday={doneToday} totalHabits={habits.length} />
          {tracksCycle && (
            <EnergyMoodCard
              energy={todayMetrics.energy}
              mood={todayMetrics.mood}
              week={energyWeek}
              onEnergy={(energy) => patchToday({ energy })}
              onMood={(mood) => patchToday({ mood })}
            />
          )}
          <WaterCard
            glasses={todayMetrics.waterGlasses}
            target={target}
            onChange={(waterGlasses) => patchToday({ waterGlasses })}
          />
          <MealsCard
            meals={settings.meals}
            done={todayMetrics.mealsDone}
            onToggle={(id) =>
              patchToday({
                mealsDone: todayMetrics.mealsDone.includes(id)
                  ? todayMetrics.mealsDone.filter((x) => x !== id)
                  : [...todayMetrics.mealsDone, id],
              })
            }
          />
          <SleepCard
            bedtime={settings.bedtime}
            wakeTime={settings.wakeTime}
            onChange={(patch) => {
              const bedtime = patch.bedtime ?? settings.bedtime;
              const wakeTime = patch.wakeTime ?? settings.wakeTime;
              void handleSaveSettings(patch);
              // Keep the schedule (which drives the reminder) and the day's
              // actual hours in step, so it is only ever entered once.
              patchToday({ sleepHours: sleepHours(bedtime, wakeTime) });
            }}
          />
          {tracksCycle && (
            <SymptomsCard
              mode={bodyMode}
              selected={todayMetrics.symptoms}
              onToggle={(symptom) =>
                patchToday({
                  symptoms: todayMetrics.symptoms.includes(symptom)
                    ? todayMetrics.symptoms.filter((x) => x !== symptom)
                    : [...todayMetrics.symptoms, symptom],
                })
              }
            />
          )}
        </div>
      )}

      {tab === "body" && (
        <div className="mt-4 flex flex-col gap-4 pb-6">
          <BodyModeCard
            settings={effectiveSettings}
            onPeriodStartedToday={() => void handleSaveSettings({ cycleStart: today })}
            onOpenSettings={() => setShowSettings(true)}
          />
          <ExerciseCard
            heading={movementHeading}
            suggestions={movement}
            logged={todayMetrics.exercise}
            onLog={logExercise}
          />
          {tracksCycle && settings.cycleStart && (
            <CycleCalendar
              settings={effectiveSettings}
              monthKey={monthKey}
              onMonthChange={setMonthKey}
            />
          )}
        </div>
      )}

      {tab === "habits" && (
        <>
          <div className="mt-4">
            <h2 className="px-5 text-sm font-bold text-ink">{t("health.history")}</h2>
            <DayPicker selected={selectedDate} onSelect={setSelectedDate} completeDates={completeDates} />
          </div>

          <div className="mt-1">
            <DaySummaryCard
              metrics={selectedMetrics}
              settings={effectiveSettings}
              waterTarget={target}
              showWellbeing={tracksCycle}
            />
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
        </>
      )}

      {showHabitForm && <HabitForm onSubmit={handleAddHabit} onClose={() => setShowHabitForm(false)} />}
      {showSettings && (
        <HealthSettingsSheet
          settings={effectiveSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
