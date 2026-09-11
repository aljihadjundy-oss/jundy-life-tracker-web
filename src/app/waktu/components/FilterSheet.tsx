"use client";

import { CATEGORY_ORDER, EMPTY_FILTERS, STATUS_ORDER, type TaskFilters } from "@/types/waktu";
import { useT } from "@/lib/i18n";

export default function FilterSheet({
  filters,
  units,
  owners,
  onChange,
  onClose,
}: {
  filters: TaskFilters;
  units: string[];
  owners: string[];
  onChange: (next: TaskFilters) => void;
  onClose: () => void;
}) {
  const t = useT();
  const set = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl animate-[slideUp_0.25s_ease-out]"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />

        <div className="mb-5">
          <h3 className="mb-2 text-sm font-bold text-ink">{t("ops.category")}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.category === ""} onClick={() => set({ category: "" })}>
              {t("ops.all")}
            </Chip>
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} active={filters.category === c} onClick={() => set({ category: c })}>
                {t(`category.task.${c}`)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-sm font-bold text-ink">{t("ops.unit")}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.unit === ""} onClick={() => set({ unit: "" })}>
              {t("ops.all")}
            </Chip>
            {units.map((unit) => (
              <Chip key={unit} active={filters.unit === unit} onClick={() => set({ unit })}>
                {unit}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-sm font-bold text-ink">{t("time.status")}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.status === ""} onClick={() => set({ status: "" })}>
              {t("ops.all")}
            </Chip>
            {STATUS_ORDER.map((s) => (
              <Chip key={s} active={filters.status === s} onClick={() => set({ status: s })}>
                {t(`status.${s}`)}
              </Chip>
            ))}
          </div>
        </div>

        {owners.length > 0 && (
          <div className="mb-5">
            <h3 className="mb-2 text-sm font-bold text-ink">{t("ops.owner")}</h3>
            <div className="flex flex-wrap gap-2">
              <Chip active={filters.owner === ""} onClick={() => set({ owner: "" })}>
                {t("ops.all")}
              </Chip>
              {owners.map((owner) => (
                <Chip key={owner} active={filters.owner === owner} onClick={() => set({ owner })}>
                  {owner}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex-1 rounded-2xl bg-surface-raised py-3.5 text-sm font-bold text-ink-muted transition active:scale-95"
          >
            {t("ops.resetFilter")}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-ink py-3.5 text-sm font-bold text-surface transition active:scale-95"
          >
            {t("app.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
