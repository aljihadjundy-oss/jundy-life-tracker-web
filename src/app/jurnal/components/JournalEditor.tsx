"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JournalEntry, NewJournalEntry } from "@/types/journal";
import { MOODS } from "@/types/journal";
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
  onCreate,
  onUpdate,
  onClose,
}: {
  entry: JournalEntry | null;
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
  const [state, setState] = useState<SaveState>("clean");

  // The id lives in both a ref and state: async code needs to read it without
  // a stale closure, and the player below needs it during render.
  const [savedId, setSavedId] = useState<string | null>(entry?.id ?? null);
  const entryId = useRef<string | null>(entry?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  // Read by the flush path so it always writes the newest values, even when
  // called from an event listener that closed over an older render.
  const latest = useRef({ title, content, mood, hasAudio, audioSeconds });
  useEffect(() => {
    latest.current = { title, content, mood, hasAudio, audioSeconds };
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
    const { title: ti, content: co, mood: mo, hasAudio: ha, audioSeconds: se } = latest.current;
    if (!ti.trim() && !co.trim() && !ha) return;

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
    setState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
  }

  // Backgrounding the app is the moment writing is most likely to be lost —
  // on a phone, closing the PWA fires this and nothing else.
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === "hidden") {
        if (timer.current) clearTimeout(timer.current);
        void flush();
      }
    }
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, [flush]);

  // Leaving the editor by any route — back button, tapping Done — saves too.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

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
        })
      );
    }

    const id = entryId.current;
    if (!id) return;

    const stored = await putClip(id, blob);
    if (!stored) return;
    setHasAudio(true);
    setAudioSeconds(seconds);
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
