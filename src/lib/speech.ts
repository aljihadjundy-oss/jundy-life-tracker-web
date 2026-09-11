/**
 * Live speech-to-text using the browser's own Web Speech API.
 *
 * This is the only transcription that is genuinely free: it ships with the
 * browser, needs no API key, and nothing has to be deployed for it. Chrome
 * (desktop and Android) and Safari 14.5+ on iOS support it behind the
 * `webkit` prefix; Firefox does not, which is why every call site has to cope
 * with it being unavailable.
 *
 * It transcribes from the microphone as you speak, not from a finished file —
 * so it runs alongside the recorder rather than after it.
 */

type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionErrorEventLike = { error: string };

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return ctor() !== null;
}

export type TranscriberHandlers = {
  /** Text confirmed so far this session, plus whatever is still being heard. */
  onText: (finalText: string, interimText: string) => void;
  onError: (code: string) => void;
};

/**
 * Wraps the recognition object so callers deal with "text so far" rather than
 * result indices. Recognition also stops itself on a pause; while the caller
 * still wants it running, this restarts it.
 */
export function startTranscribing(lang: string, handlers: TranscriberHandlers) {
  const Recognition = ctor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalText = "";
  let stopped = false;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const chunk = result[0].transcript;
      if (result.isFinal) finalText += chunk;
      else interim += chunk;
    }
    handlers.onText(finalText, interim);
  };

  recognition.onerror = (event) => {
    // "no-speech" and "aborted" are normal punctuation in a long dictation.
    if (event.error === "no-speech" || event.error === "aborted") return;
    handlers.onError(event.error);
  };

  recognition.onend = () => {
    if (stopped) return;
    // A natural pause ends the session; keep going until told otherwise.
    try {
      recognition.start();
    } catch {
      // Already restarting — nothing to do.
    }
  };

  try {
    recognition.start();
  } catch {
    return null;
  }

  return {
    stop() {
      stopped = true;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
      return finalText;
    },
  };
}
