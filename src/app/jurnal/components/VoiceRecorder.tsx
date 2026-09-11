"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { speechSupported, startTranscribing } from "@/lib/speech";
import { useLanguage, useT } from "@/lib/i18n";

type Status = "idle" | "recording" | "saving";

/**
 * Records a voice note and transcribes it as you speak. Both run at once: the
 * recorder keeps the audio, the browser's speech engine produces the text.
 */
export default function VoiceRecorder({
  onTranscript,
  onClip,
}: {
  /** Called once, on stop, with everything that was transcribed. */
  onTranscript: (text: string) => void;
  /** Called with the recorded audio and its length in seconds. */
  onClip: (blob: Blob, seconds: number) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [live, setLive] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Feature detection has to happen on the client; the server has no window to
  // ask. useSyncExternalStore gives a stable server value without a
  // render-then-correct flash.
  const supported = useSyncExternalStore(
    () => () => {},
    () => speechSupported(),
    () => false
  );

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const transcriber = useRef<{ stop: () => string } | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    return () => {
      if (ticker.current) clearInterval(ticker.current);
      transcriber.current?.stop();
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    setError(null);
    setLive("");
    setSeconds(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t("journal.micDenied"));
      return;
    }

    chunks.current = [];
    const media = new MediaRecorder(stream);
    media.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.current.push(event.data);
    };
    media.onstop = () => {
      const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
      const length = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      stream.getTracks().forEach((track) => track.stop());
      if (blob.size > 0) onClip(blob, length);
      setStatus("idle");
    };

    recorder.current = media;
    startedAt.current = Date.now();
    media.start();

    transcriber.current = startTranscribing(lang === "en" ? "en-US" : "id-ID", {
      onText: (finalText, interim) => setLive(finalText + interim),
      onError: (code) => setError(t("journal.speechError", { code })),
    });

    ticker.current = setInterval(
      () => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)),
      1000
    );
    setStatus("recording");
  }

  function stop() {
    setStatus("saving");
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;

    const text = transcriber.current?.stop() ?? "";
    transcriber.current = null;
    if (text.trim()) onTranscript(text.trim());

    recorder.current?.stop();
    recorder.current = null;
    setLive("");
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl bg-surface-raised p-3.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={status === "recording" ? stop : start}
          disabled={status === "saving"}
          aria-label={status === "recording" ? t("journal.stopRecording") : t("journal.record")}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-50 ${
            status === "recording" ? "bg-red-500 text-white" : "bg-ink text-surface"
          }`}
        >
          {status === "recording" ? (
            <span className="h-3.5 w-3.5 rounded-[3px] bg-current" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-ink">
            {status === "recording" ? t("journal.recording") : t("journal.voiceNote")}
          </p>
          <p className="text-[11px] text-ink-muted">
            {status === "recording"
              ? mmss
              : supported
                ? t("journal.voiceHint")
                : t("journal.noSpeechApi")}
          </p>
        </div>

        {status === "recording" && (
          <span className="flex shrink-0 items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-red-500"
                style={{
                  height: 8 + ((seconds + i) % 3) * 6,
                  transition: "height 0.3s ease",
                }}
              />
            ))}
          </span>
        )}
      </div>

      {status === "recording" && supported && (
        <p className="mt-3 max-h-24 overflow-y-auto rounded-xl bg-surface-card p-3 text-xs leading-relaxed text-ink">
          {live || <span className="text-ink-muted">{t("journal.listening")}</span>}
        </p>
      )}

      {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
