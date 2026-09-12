"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalEntry, NewJournalEntry } from "@/types/journal";
import { MOODS, WRITING_TYPES, type Topic, type WritingType } from "@/types/journal";
import { formatDate, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n";
import { deleteClip, putClip } from "@/lib/audio-store";
import VoiceRecorder from "./VoiceRecorder";
import AudioPlayer from "./AudioPlayer";

/** How long to wait after the last keystroke before writing to Firestore. */
const AUTOSAVE_DELAY_MS = 1200;

type SaveState = "clean" | "dirty" | "saving" | "saved";

export default function JournalEditor({
  entry,
  topics,
  onCreate,
  onUpdate,
  onClose,
}: {
  entry: JournalEntry | null;
  topics: Topic[];
  /** Creates the entry and returns its new id. */
  onCreate: (data: NewJournalEntry) => string | Promise<string>;
  onUpdate: (id: string, data: Partial<NewJournalEntry>) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useT();
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [mood, setMood] = useState(entry?.mood ?? "");
  const [hasAudio, setHasAudio] = useState(entry?.hasAudio ?? false);
  const [audioSeconds, setAudioSeconds] = useState(entry?.audioSeconds ?? 0);
  const [date] = useState(entry?.date ?? todayISO());
  const [type, setType] = useState<WritingType>(entry?.type ?? "journal");
  const [topicIds, setTopicIds] = useState<string[]>(entry?.topicIds ?? []);
  const [description, setDescription] = useState(entry?.description ?? "");
  const [favorite, setFavorite] = useState(entry?.favorite ?? false);
  const [finished, setFinished] = useState(entry?.finished ?? false);
  const [archived] = useState(entry?.archived ?? false);
  const [state, setState] = useState<SaveState>("clean");

  // The id lives in both a ref and state: async code needs to read it without
  // a stale closure, and the player below needs it during render.
  const [savedId, setSavedId] = useState<string | null>(entry?.id ?? null);
  const entryId = useRef<string | null>(entry?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  /**
   * Ada perubahan yang belum tersimpan.
   *
   * Ref, bukan state: penjaga ini dibaca oleh cleanup effect yang TIDAK boleh
   * ikut berubah tiap render, dan membacanya dari state akan mengunci nilai
   * lama di dalam closure.
   */
  const dirty = useRef(false);

  // Read by the flush path so it always writes the newest values, even when
  // called from an event listener that closed over an older render.
  const latest = useRef({
    title, content, mood, hasAudio, audioSeconds,
    type, topicIds, description, favorite, finished, archived,
  });
  useEffect(() => {
    latest.current = {
      title, content, mood, hasAudio, audioSeconds,
      type, topicIds, description, favorite, finished, archived,
    };
  });

  function rememberId(id: string) {
    entryId.current = id;
    setSavedId(id);
  }

  /**
   * Writes whatever is on screen. Creating on the first flush and updating
   * afterwards is what lets autosave run without the user ever pressing Save.
   */
  const flush = useCallback(async () => {
    // Tanpa penjaga ini, setiap pemanggilan flush menulis ulang isi yang sama.
    // Itu bukan sekadar boros: tulisan memicu listener Firestore, listener
    // memicu render halaman, render mengganti identitas onCreate/onUpdate, dan
    // cleanup effect di bawah memanggil flush lagi — putaran tanpa ujung yang
    // menguasai thread utama sampai mengetik pun tidak bisa.
    if (!dirty.current) return;

    const { title: ti, content: co, mood: mo, hasAudio: ha, audioSeconds: se } = latest.current;
    if (!ti.trim() && !co.trim() && !ha) return;
    const meta = latest.current;
    dirty.current = false;

    // Serialise: two overlapping flushes would create two entries.
    if (inFlight.current) await inFlight.current;

    const run = (async () => {
      setState("saving");
      const data: NewJournalEntry = {
        title: ti.trim() || t("journal.untitled"),
        content: co,
        mood: mo,
        date,
        hasAudio: ha,
        audioSeconds: se,
        type: meta.type,
        topicIds: meta.topicIds,
        description: meta.description.trim(),
        favorite: meta.favorite,
        finished: meta.finished,
        archived: meta.archived,
      };
      if (entryId.current) await onUpdate(entryId.current, data);
      else rememberId(await onCreate(data));
      setState("saved");
    })();

    inFlight.current = run.finally(() => {
      inFlight.current = null;
    });
    await inFlight.current;
  }, [date, onCreate, onUpdate, t]);

  function touch() {
    dirty.current = true;
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  }

  /**
   * flush terbaru, dibaca lewat ref.
   *
   * flush adalah useCallback yang bergantung pada onCreate/onUpdate. Halaman
   * pemanggil membuat ulang kedua fungsi itu tiap render, jadi identitas flush
   * ikut berubah tiap render. Dua effect di bawah hanya boleh berjalan sekali
   * seumur hidup komponen — kalau mereka bergantung pada flush, cleanup-nya
   * ikut berjalan tiap render dan menyimpan ulang tanpa henti.
   */
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });

  // Backgrounding the app is the moment writing is most likely to be lost —
  // on a phone, closing the PWA fires this and nothing else.
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") {
        if (timer.current) clearTimeout(timer.current);
        void flushRef.current();
      }
    }
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  // Leaving the editor by any route — back button, tapping Done — saves too.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void flushRef.current();
    };
  }, []);

  async function handleClip(blob: Blob, seconds: number) {
    // The clip is filed under the entry id, so the entry has to exist first.
    if (!entryId.current) await flush();
    if (!entryId.current) {
      // Nothing typed and no transcript — create a stub so the audio has a home.
      rememberId(
        await onCreate({
          title: t("journal.voiceNote"),
          content: "",
          mood,
          date,
          hasAudio: true,
          audioSeconds: seconds,
          type,
          topicIds,
          description: description.trim(),
          favorite,
          finished,
          archived,
        })
      );
    }

    const id = entryId.current;
    if (!id) return;

    const stored = await putClip(id, blob);
    if (!stored) return;
    setHasAudio(true);
    setAudioSeconds(seconds);
    latest.current = { ...latest.current, hasAudio: true, audioSeconds: seconds };
    await onUpdate(id, { hasAudio: true, audioSeconds: seconds });
    setState("saved");
  }

  function appendTranscript(text: string) {
    setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
    touch();
  }

  async function removeAudio() {
    if (!entryId.current) return;
    await deleteClip(entryId.current);
    setHasAudio(false);
    setAudioSeconds(0);
    await onUpdate(entryId.current, { hasAudio: false, audioSeconds: 0 });
  }

  const statusLabel =
    state === "saving"
      ? t("app.saving")
      : state === "saved"
        ? t("journal.autoSaved")
        : state === "dirty"
          ? t("journal.unsaved")
          : "";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <button
          onClick={onClose}
          aria-label={t("app.close")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink transition active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="min-w-0 flex-1 truncate text-center text-xs font-medium text-ink-muted">
          {formatDate(date)}
        </span>

        <span
          className={`shrink-0 text-[11px] font-semibold ${
            state === "saved" ? "text-accent-finance" : "text-ink-muted"
          }`}
        >
          {statusLabel}
        </span>

        {/* Simpan manual, di samping simpan otomatis.
            Otomatis saja ternyata tidak cukup: tanpa tombol, tidak ada cara
            memaksa penyimpanan sekarang juga, dan tidak ada yang bisa ditekan
            saat ragu apakah tulisannya sudah aman. */}
        <button
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            void flush();
          }}
          // Hanya hidup saat benar-benar ada yang belum tersimpan. "saved"
          // ikut dimatikan: menekannya tidak akan menulis apa pun, dan tombol
          // yang bisa ditekan tapi tidak melakukan apa-apa lebih membingungkan
          // daripada tombol yang jelas mati.
          disabled={state !== "dirty"}
          className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-surface transition active:scale-95 disabled:opacity-40"
        >
          {t("app.save")}
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            touch();
          }}
          placeholder={t("journal.titlePlaceholder")}
          className="mb-3 w-full bg-transparent text-xl font-bold text-ink outline-none placeholder:text-ink-muted"
        />

        <div className="mb-4 flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMood(mood === m ? "" : m);
                touch();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
                mood === m ? "bg-ink" : "bg-surface-raised"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Jenis tulisan. Mood tetap di atas karena itu milik catatan harian;
            baris ini yang memutuskan sebuah entri jadi puisi, naskah, atau
            artikel — dan itu yang menentukan tampilnya di penyaring. */}
        <div className="mb-4 flex flex-wrap gap-2">
          {WRITING_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setType(option);
                touch();
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                type === option ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
              }`}
            >
              {t(`journal.type.${option}`)}
            </button>
          ))}
        </div>

        {/* Topik hanya muncul untuk naskah: catatan harian tidak diarsipkan
            per topik, dan menampilkannya di sana cuma menambah bidang kosong. */}
        {type !== "journal" && (
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-ink-muted">{t("journal.topics")}</p>
            {topics.length === 0 ? (
              <p className="text-xs text-ink-muted">{t("journal.noTopicsYet")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topics
                  .filter((topic) => !topic.archived)
                  .map((topic) => {
                    const on = topicIds.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          setTopicIds((prev) =>
                            on ? prev.filter((id) => id !== topic.id) : [...prev, topic.id]
                          );
                          touch();
                        }}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          on ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
                        }`}
                      >
                        {topic.name}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {type !== "journal" && (
          <input
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              touch();
            }}
            placeholder={t("journal.descriptionPlaceholder")}
            className="mb-4 w-full rounded-xl border border-border bg-surface-card px-3 py-2.5 text-sm text-ink outline-none focus:border-ink"
          />
        )}

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFavorite((v) => !v);
              touch();
            }}
            aria-pressed={favorite}
            className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
              favorite ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {favorite ? "★" : "☆"} {t("journal.favorite")}
          </button>
          <button
            type="button"
            onClick={() => {
              setFinished((v) => !v);
              touch();
            }}
            aria-pressed={finished}
            className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
              finished ? "bg-ink text-surface" : "bg-surface-raised text-ink-muted"
            }`}
          >
            {finished ? "✓" : "○"} {t("journal.finished")}
          </button>
        </div>

        <div className="mb-4">
          <VoiceRecorder onTranscript={appendTranscript} onClip={handleClip} />
        </div>

        {hasAudio && savedId && (
          <div className="mb-4">
            <AudioPlayer entryId={savedId} seconds={audioSeconds} onDelete={removeAudio} />
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            touch();
          }}
          placeholder={t("journal.contentPlaceholder")}
          className="min-h-[35vh] flex-1 resize-none bg-transparent text-base leading-relaxed text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
    </div>
  );
}
