import { addDaysISO, parseISODate } from "./format";
import type { BodyMode, ExercisePrefs, HealthSettings } from "@/types/kesehatan";

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export type CycleInfo = {
  /** 1-based day within the cycle. */
  day: number;
  phase: CyclePhase;
  /** ISO date the next period is predicted to start. */
  nextPeriod: string;
  /** Days until that date. */
  daysLeft: number;
};

function daysBetween(fromISO: string, toISO: string) {
  const from = parseISODate(fromISO).getTime();
  const to = parseISODate(toISO).getTime();
  return Math.round((to - from) / 86400000);
}

/** Cycle day and phase for `date`. Mirrors Rima's useCycle. */
export function cycleInfo(settings: HealthSettings, date: string): CycleInfo {
  const length = Math.max(15, settings.cycleLength);
  let day = (daysBetween(settings.cycleStart, date) % length) + 1;
  if (day <= 0) day += length;

  // Ovulation lands 14 days before the next period, not 14 days after the last.
  const ovulation = length - 14;
  let phase: CyclePhase = "follicular";
  if (day <= settings.periodLength) phase = "menstrual";
  else if (day >= ovulation - 1 && day <= ovulation + 1) phase = "ovulation";
  else if (day > ovulation + 1) phase = "luteal";

  const daysLeft = length - day + 1;
  return { day, phase, nextPeriod: addDaysISO(date, daysLeft), daysLeft };
}

export type DayMark = "period" | "fertile" | null;

/** How a calendar cell should be shaded. */
export function markForDate(settings: HealthSettings, date: string): DayMark {
  if (!settings.cycleStart) return null;
  const length = Math.max(15, settings.cycleLength);
  let day = (daysBetween(settings.cycleStart, date) % length) + 1;
  if (day <= 0) day += length;
  const ovulation = length - 14;
  if (day <= settings.periodLength) return "period";
  // The fertile window opens a few days before ovulation because sperm survive.
  if (day >= ovulation - 3 && day <= ovulation + 1) return "fertile";
  return null;
}

export type PregnancyInfo = { week: number; trimester: 1 | 2 | 3 };

export function pregnancyInfo(dueDate: string, date: string): PregnancyInfo {
  const weeksToGo = Math.ceil(daysBetween(date, dueDate) / 7);
  const week = Math.max(1, Math.min(42, 40 - weeksToGo));
  const trimester = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  return { week, trimester };
}

/** Breastfeeding raises fluid needs; everything else uses the chosen target. */
export function waterTarget(settings: HealthSettings) {
  return settings.bodyMode === "breastfeeding" ? 10 : settings.waterTarget;
}

/** Hours between bedtime and wake time, wrapping past midnight. */
export function sleepHours(bedtime: string, wakeTime: string) {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  const bed = bh * 60 + bm;
  const wake = wh * 60 + wm;
  return Math.round((((wake - bed + 1440) % 1440) / 60) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Movement suggestions
//
// Slugs, not sentences: the label and the "why" line are translated. Durations
// come from Rima and are shortened for beginners.
// ---------------------------------------------------------------------------

export type Suggestion = { id: string; minutes: number };

const BANK: Record<string, Suggestion[]> = {
  menstrual: [
    { id: "restorativeYoga", minutes: 20 },
    { id: "easyWalk", minutes: 25 },
    { id: "hipStretch", minutes: 12 },
  ],
  follicular: [
    { id: "strength", minutes: 35 },
    { id: "pilates", minutes: 30 },
    { id: "briskWalk", minutes: 30 },
  ],
  ovulation: [
    { id: "lightHiit", minutes: 20 },
    { id: "zumba", minutes: 40 },
    { id: "weights", minutes: 40 },
  ],
  luteal: [
    { id: "slowFlowYoga", minutes: 25 },
    { id: "eveningWalk", minutes: 30 },
    { id: "lightWeights", minutes: 25 },
  ],
  pregnant: [
    { id: "walk", minutes: 25 },
    { id: "prenatalYoga", minutes: 30 },
    { id: "easySwim", minutes: 25 },
  ],
  breastfeeding: [
    { id: "strollerWalk", minutes: 25 },
    { id: "shoulderStretch", minutes: 10 },
    { id: "pelvicFloor", minutes: 12 },
  ],
  // No cycle to adapt to, so this is a plain balanced week.
  none: [
    { id: "strength", minutes: 35 },
    { id: "briskWalk", minutes: 30 },
    { id: "hipStretch", minutes: 12 },
  ],
};

export function suggestions(
  mode: BodyMode,
  phase: CyclePhase,
  prefs: ExercisePrefs
): Suggestion[] {
  const key = mode === "cycle" ? phase : mode;
  let list = BANK[key] ?? BANK.none;
  if (prefs.level === "beginner") {
    list = list.map((s) => ({ ...s, minutes: Math.max(12, s.minutes - 5) }));
  }
  // Someone already on their feet all day gets the gentlest option first.
  if (prefs.activity === "standing") list = [...list].reverse();
  return list;
}
