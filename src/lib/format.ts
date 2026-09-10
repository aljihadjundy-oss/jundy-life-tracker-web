export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
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
  return new Intl.DateTimeFormat("id-ID", {
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
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(parseISODate(isoDate));
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
