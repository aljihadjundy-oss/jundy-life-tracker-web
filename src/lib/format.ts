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
