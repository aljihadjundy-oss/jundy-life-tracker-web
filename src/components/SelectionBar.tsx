"use client";

import { useState } from "react";
import type { Selection } from "@/lib/useSelection";
import { useT } from "@/lib/i18n";

/**
 * Floating action bar for bulk operations. Sits just above the bottom nav so
 * it never covers it, and asks for confirmation before deleting because the
 * delete itself is not undoable.
 */
export default function SelectionBar({
  selection,
  allIds,
  onDelete,
  extra,
}: {
  selection: Selection;
  /** Every id currently visible, for "select all". */
  allIds: string[];
  onDelete: (ids: string[]) => void | Promise<void>;
  /** Module-specific bulk action rendered on its own row above the buttons. */
  extra?: React.ReactNode;
}) {
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!selection.active) return null;

  const allSelected = allIds.length > 0 && selection.count === allIds.length;

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(selection.ids);
      selection.stop();
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-4 md:bottom-6 md:left-[4.5rem] lg:left-56">
      <div className="mx-auto max-w-md rounded-2xl bg-ink p-2.5 shadow-2xl md:max-w-lg">
        {extra && <div className="mb-2 px-1">{extra}</div>}
        <div className="flex items-center gap-2">
        <button
          onClick={() => selection.stop()}
          className="rounded-full px-3 py-2 text-xs font-semibold text-surface/70 transition active:scale-95"
        >
          {t("app.cancel")}
        </button>

        <span className="flex-1 text-center text-xs font-bold text-surface">
          {t("bulk.selected", { count: selection.count })}
        </span>

        <button
          onClick={() => selection.replace(allSelected ? [] : allIds)}
          className="rounded-full px-3 py-2 text-xs font-semibold text-surface/70 transition active:scale-95"
        >
          {allSelected ? t("bulk.clearAll") : t("bulk.selectAll")}
        </button>

        {confirming ? (
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60"
          >
            {busy ? t("app.saving") : t("bulk.confirmDelete")}
          </button>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            disabled={selection.count === 0}
            className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-40"
          >
            {t("app.delete")}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
