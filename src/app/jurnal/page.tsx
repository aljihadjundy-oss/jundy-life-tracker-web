"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import { addEntry, deleteEntry,
  deleteEntries, subscribeEntries, updateEntry } from "@/lib/journal";
import type { JournalEntry, NewJournalEntry } from "@/types/journal";
import JournalCard from "./components/JournalCard";
import JournalEditor from "./components/JournalEditor";
import { useT } from "@/lib/i18n";
import { deleteClip } from "@/lib/audio-store";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { awardXpInBackground } from "@/lib/gamification";

export default function JurnalPage() {
  return (
    <AppShell>
      <JurnalContent />
    </AppShell>
  );
}

function JurnalContent() {
  const { user } = useAuth();
  const t = useT();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const selection = useSelection();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeEntries(user.uid, (items) => {
      setEntries(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  function openNew() {
    setEditingEntry(null);
    setShowEditor(true);
  }

  function openEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setShowEditor(true);
  }

  async function handleCreate(data: NewJournalEntry) {
    if (!user) throw new Error("not signed in");
    const id = await addEntry(user.uid, data);
    awardXpInBackground(user.uid, "journal");
    return id;
  }

  async function handleUpdate(id: string, data: Partial<NewJournalEntry>) {
    if (!user) return;
    await updateEntry(user.uid, id, data);
  }

  async function handleDelete(id: string) {
    if (!user) return;
    await deleteEntry(user.uid, id);
    await deleteClip(id);
  }

  async function handleBulkDelete(ids: string[]) {
    if (!user) return;
    await deleteEntries(user.uid, ids);
    await Promise.all(ids.map(deleteClip));
  }

  return (
    <>
      <TopBar title={t("journal.title")} subtitle={t("journal.subtitle")} />

      <div className="mt-2 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("journal.allEntries")}</h2>
        <div className="flex gap-2">
        <button
          onClick={() => (selection.active ? selection.stop() : selection.start())}
          className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
        >
          {selection.active ? t("app.cancel") : t("bulk.select")}
        </button>
        <button
          onClick={openNew}
          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
        >
          {t("journal.write")}
        </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">{t("journal.empty")}</p>
          </div>
        )}

        {entries.map((entry) => (
          <JournalCard
            key={entry.id}
            entry={entry}
            onOpen={openEntry}
            onDelete={handleDelete}
            selectMode={selection.active}
            selected={selection.isSelected(entry.id)}
            onToggleSelect={selection.toggle}
            onLongPress={selection.start}
          />
        ))}
      </div>

      <SelectionBar
        selection={selection}
        allIds={entries.map((entry) => entry.id)}
        onDelete={handleBulkDelete}
      />

      {showEditor && (
        <JournalEditor
          entry={editingEntry}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
