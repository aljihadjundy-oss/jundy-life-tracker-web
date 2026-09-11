// Reads the language the same way i18n.tsx does. Kept dependency-free so these
// stay plain functions — components re-render on language change because they
// also subscribe via useT(), which re-runs these formatters.
function locale() {
  try {
    return localStorage.getItem("lang") === "en" ? "en-US" : "id-ID";
  } catch {
    return "id-ID";
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Parses a yyyy-mm-dd string as a local-timezone date (avoids the UTC
// off-by-one shift `new Date(isoDate)` causes in timezones behind UTC).
export function parseISODate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat(locale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseISODate(isoDate));
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDaysISO(isoDate: string, days: number) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekdayShort(isoDate: string) {
  return new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(parseISODate(isoDate));
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Time of day. Stored as "HH:mm" strings so a task's clock time never shifts
// when the device timezone changes — the user means "9 in the morning", not an
// instant on the timeline.
// ---------------------------------------------------------------------------

export function minutesFromHHmm(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function hhmmFromMinutes(minutes: number) {
  const clamped = ((minutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function addMinutesToHHmm(hhmm: string, minutes: number) {
  return hhmmFromMinutes(minutesFromHHmm(hhmm) + minutes);
}

/** Renders "09:00" as 09.00 (id) or 9:00 AM (en). */
export function formatTime(hhmm: string) {
  if (!/^\d{2}:\d{2}$/.test(hhmm)) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale(), { hour: "2-digit", minute: "2-digit" }).format(
    new Date(2000, 0, 1, h, m)
  );
}

export function formatDuration(minutes: number) {
  const hourUnit = locale() === "en-US" ? "h" : "j";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}${hourUnit}`;
  return `${h}${hourUnit} ${m}m`;
}

export function nowHHmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Month grids
// ---------------------------------------------------------------------------

export function monthKeyOf(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function addMonths(monthKey: string, delta: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return currentMonthKey(date);
}

export function formatMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}

/**
 * Six rows of seven ISO dates covering `monthKey`, padded with the tail of the
 * previous month and the head of the next one. Weeks start on Monday, which is
 * how Indonesian calendars are printed.
 */
export function monthMatrix(monthKey: string): string[][] {
  const [y, m] = monthKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  // getDay(): 0 = Sunday. Shift so Monday = 0.
  const lead = (first.getDay() + 6) % 7;
  const start = new Date(y, m - 1, 1 - lead);
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start);
      cell.setDate(start.getDate() + w * 7 + d);
      week.push(toISODate(cell));
    }
    weeks.push(week);
  }
  return weeks;
}

/** Monday-first weekday initials, localised. */
export function weekdayInitials() {
  const fmt = new Intl.DateTimeFormat(locale(), { weekday: "short" });
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
}

/** ISO dates of the Monday-first week containing `isoDate`. */
export function weekOf(isoDate: string) {
  const date = parseISODate(isoDate);
  const lead = (date.getDay() + 6) % 7;
  const monday = addDaysISO(isoDate, -lead);
  return Array.from({ length: 7 }, (_, i) => addDaysISO(monday, i));
}
