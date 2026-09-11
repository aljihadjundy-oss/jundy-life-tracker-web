"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/lib/auth-context";
import {
  addEntriesBatch,
  addEntry,
  addTopic,
  deleteEntries,
  deleteEntry,
  deleteTopic,
  seedTopics,
  subscribeEntries,
  subscribeTopics,
  updateEntry,
  updateTopic,
} from "@/lib/journal";
import { DEFAULT_TOPICS, type JournalEntry, type NewJournalEntry, type Topic } from "@/types/journal";
import type { WritingImportResult } from "@/lib/import-writing";
import { applyWritingFilters, EMPTY_FILTERS, hasActiveFilter, topicCounts, type WritingFilters } from "@/lib/writing";
import JournalCard from "./components/JournalCard";
import JournalEditor from "./components/JournalEditor";
import WritingFilterRow from "./components/WritingFilterRow";
import TopicsSheet from "./components/TopicsSheet";
import NotionImportSheet from "./components/NotionImportSheet";
import { useT } from "@/lib/i18n";
import { deleteClip } from "@/lib/audio-store";
import SelectionBar from "@/components/SelectionBar";
import { useSelection } from "@/lib/useSelection";
import { awardXpInBackground } from "@/lib/gamification";
import { reportFailure } from "@/lib/notify";

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filters, setFilters] = useState<WritingFilters>(EMPTY_FILTERS);
  const [showTopics, setShowTopics] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeEntries(user.uid, (items) => {
      setEntries(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeTopics(user.uid, setTopics);
  }, [user]);

  // Topik bawaan disiapkan sekali, dan hanya kalau koleksinya benar-benar
  // kosong — bukan setiap kali daftarnya kebetulan kosong saat memuat, karena
  // itu akan menggandakannya di tiap pembukaan halaman.
  // Ref, bukan state: ini cuma penanda "sudah pernah dijalankan" yang tidak
  // perlu memicu render, dan setState di dalam effect memang dilarang di repo
  // ini karena bisa menyebabkan render beruntun.
  const seeded = useRef(false);
  useEffect(() => {
    if (!user || loading || seeded.current || topics.length > 0) return;
    seeded.current = true;
    reportFailure(seedTopics(user.uid, DEFAULT_TOPICS), t("notify.saveFailed"));
  }, [user, loading, topics.length, t]);

  const counted = useMemo(() => topicCounts(topics, entries), [topics, entries]);
  // Layar kelola topik butuh yang terarsip juga, baris penyaring tidak.
  const countedAll = useMemo(() => topicCounts(topics, entries, true), [topics, entries]);
  const visible = useMemo(() => applyWritingFilters(entries, filters), [entries, filters]);

  function openNew() {
    setEditingEntry(null);
    setShowEditor(true);
  }

  function openEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setShowEditor(true);
  }

  function handleCreate(data: NewJournalEntry) {
    if (!user) throw new Error("not signed in");
    // id dibuat di klien, jadi auto-save bisa langsung lanjut — lihat addEntry.
    const { id, done } = addEntry(user.uid, data);
    reportFailure(done, t("notify.saveFailed"));
    awardXpInBackground(user.uid, "journal");
    return id;
  }

  function handleUpdate(id: string, data: Partial<NewJournalEntry>) {
    if (!user) return;
    reportFailure(updateEntry(user.uid, id, data), t("notify.saveFailed"));
  }

  function handleDelete(id: string) {
    if (!user) return;
    // Klip suara hanya ada di perangkat ini, jadi dihapus bersamaan.
    reportFailure(
      Promise.all([deleteEntry(user.uid, id), deleteClip(id)]),
      t("notify.deleteFailed")
    );
  }

  function handleAddTopic(name: string) {
    if (!user) return;
    reportFailure(addTopic(user.uid, { name, archived: false }).done, t("notify.saveFailed"));
  }

  function handleRenameTopic(id: string, name: string) {
    if (!user) return;
    reportFailure(updateTopic(user.uid, id, { name }), t("notify.saveFailed"));
  }

  function handleArchiveTopic(id: string, archived: boolean) {
    if (!user) return;
    reportFailure(updateTopic(user.uid, id, { archived }), t("notify.saveFailed"));
  }

  function handleDeleteTopic(id: string) {
    if (!user) return;
    reportFailure(deleteTopic(user.uid, id), t("notify.deleteFailed"));
    // Penyaring yang menunjuk topik yang baru dihapus akan mengosongkan daftar
    // tanpa sebab yang terlihat, jadi dilepas bersamaan.
    setFilters((prev) => (prev.topicId === id ? { ...prev, topicId: "" } : prev));
  }

  /**
   * Impor ekspor Notion.
   *
   * Topik dibuat lebih dulu dan ditunggu selesai — id-nya diperlukan untuk
   * menautkan tulisan, dan menulis keduanya berbarengan akan menghasilkan
   * tulisan yang menunjuk topik yang belum ada.
   */
  async function handleImport(result: WritingImportResult) {
    if (!user) return;
    const uid = user.uid;

    const byName = new Map(topics.map((topic) => [topic.name.toLowerCase(), topic.id]));
    for (const name of result.unknownTopics) {
      if (byName.has(name.toLowerCase())) continue;
      const { id, done } = addTopic(uid, { name, archived: false });
      byName.set(name.toLowerCase(), id);
      await done;
    }

    const entriesToAdd: NewJournalEntry[] = result.rows.map((row) => ({
      ...row.entry,
      topicIds: row.topicNames
        .map((name) => byName.get(name.toLowerCase()))
        .filter((id): id is string => Boolean(id)),
    }));

    await addEntriesBatch(uid, entriesToAdd);
  }

  function handleBulkDelete(ids: string[]) {
    if (!user) return;
    reportFailure(
      Promise.all([deleteEntries(user.uid, ids), ...ids.map(deleteClip)]),
      t("notify.deleteFailed")
    );
  }

  return (
    <>
      <TopBar title={t("journal.title")} subtitle={t("journal.subtitle")} />

      <div className="mt-2 flex items-center justify-between px-5">
        <h2 className="text-sm font-bold text-ink">{t("journal.allEntries")}</h2>
        <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={() => (selection.active ? selection.stop() : selection.start())}
          className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
        >
          {selection.active ? t("app.cancel") : t("bulk.select")}
        </button>
        <button
          onClick={() => setShowTopics(true)}
          className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
        >
          {t("journal.topics")}
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="rounded-full bg-surface-raised px-3.5 py-2 text-xs font-bold text-ink-muted transition active:scale-95"
        >
          {t("journal.import")}
        </button>
        <button
          onClick={openNew}
          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95"
        >
          {t("journal.write")}
        </button>
        </div>
      </div>

      <div className="mt-3 px-5">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder={t("journal.searchPlaceholder")}
          className="w-full rounded-xl border border-border bg-surface-card px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
        />
      </div>

      <div className="mt-3">
        <WritingFilterRow filters={filters} topics={counted} onChange={setFilters} />
      </div>

      {hasActiveFilter(filters) && (
        <div className="mt-2 px-5">
          <button
            onClick={() => setFilters({ ...EMPTY_FILTERS, search: filters.search })}
            className="text-xs font-semibold text-ink-muted underline"
          >
            {t("ops.resetFilter")}
          </button>
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5 px-5 pb-6">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-ink" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="rounded-2xl bg-surface-raised p-8 text-center">
            <p className="text-sm text-ink-muted">
              {entries.length === 0
                ? t("journal.empty")
                : hasActiveFilter(filters) || filters.search
                  ? t("journal.emptyFiltered")
                  : t("journal.empty")}
            </p>
          </div>
        )}

        {visible.map((entry) => (
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
        allIds={visible.map((entry) => entry.id)}
        onDelete={handleBulkDelete}
      />

      {showTopics && (
        <TopicsSheet
          topics={countedAll}
          onAdd={handleAddTopic}
          onRename={handleRenameTopic}
          onToggleArchive={handleArchiveTopic}
          onDelete={handleDeleteTopic}
          onClose={() => setShowTopics(false)}
        />
      )}

      {showImport && (
        <NotionImportSheet
          topics={topics}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showEditor && (
        <JournalEditor
          entry={editingEntry}
          topics={topics}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
