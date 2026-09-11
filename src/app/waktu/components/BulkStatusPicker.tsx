"use client";

import { STATUS_ORDER, type TaskStatus } from "@/types/waktu";
import { useT } from "@/lib/i18n";

/** Sets one status across every selected task, from inside the selection bar. */
export default function BulkStatusPicker({ onPick }: { onPick: (status: TaskStatus) => void }) {
  const t = useT();
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
      <span className="shrink-0 self-center pr-1 text-[11px] font-semibold text-surface/60">
        {t("ops.setStatus")}
      </span>
      {STATUS_ORDER.map((status) => (
        <button
          key={status}
          onClick={() => onPick(status)}
          className="shrink-0 rounded-full bg-surface/15 px-3 py-1.5 text-[11px] font-bold text-surface transition active:scale-95"
        >
          {t(`status.${status}`)}
        </button>
      ))}
    </div>
  );
}
