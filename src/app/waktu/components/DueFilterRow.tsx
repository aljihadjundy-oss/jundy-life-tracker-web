"use client";

import { DUE_RANGES, type DueRange, type TaskFilters } from "@/types/waktu";
import { formatDate, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";

/**
 * Day filter for the list. Picking "Tanggal" reveals a date input; picking
 * anything else clears it, so the two can never disagree.
 */
export default function DueFilterRow({
  filters,
  onChange,
}: {
  filters: TaskFilters;
  onChange: (next: TaskFilters) => void;
}) {
  const t = useT();

  function pick(range: DueRange) {
    onChange({
      ...filters,
      dueRange: range,
      date: range === "date" ? filters.date || todayISO() : "",
    });
  }

  return (
    <div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5">
        {DUE_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => pick(range)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              filters.dueRange === range
                ? "bg-accent-time text-white"
                : "bg-surface-raised text-ink-muted"
            }`}
          >
            {range === "date" && filters.date
              ? formatDate(filters.date)
              : t(`ops.due.${range}`)}
          </button>
        ))}
      </div>

      {filters.dueRange === "date" && (
        <div className="mt-2 px-5">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onChange({ ...filters, date: e.target.value })}
            aria-label={t("ops.due.date")}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-2.5 text-sm tabular-nums text-ink outline-none focus:border-accent-time"
          />
        </div>
      )}
    </div>
  );
}
