import { useCallback, useEffect, useRef, useState } from "react";
import { requireOptionalNativeModule } from "expo";

type ExpoSpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "interrupted"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed"
  | "busy"
  | "client"
  | "speech-timeout"
  | "unknown";

interface ExpoSpeechRecognitionResult {
  transcript: string;
}

interface ExpoSpeechRecognitionResultEvent {
  isFinal: boolean;
  results: ExpoSpeechRecognitionResult[];
}

interface ExpoSpeechRecognitionErrorEvent {
  error: ExpoSpeechRecognitionErrorCode;
  message: string;
  code?: number;
}

interface ExpoSpeechRecognitionPermissionResponse {
  granted: boolean;
}

interface ExpoSpeechRecognitionOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  maxAlternatives?: number;
}

type SpeechRecognitionEventMap = {
  start: null;
  result: ExpoSpeechRecognitionResultEvent;
  end: null;
  error: ExpoSpeechRecognitionErrorEvent;
};

interface EventSubscriptionLike {
  remove: () => void;
}

interface ExpoSpeechRecognitionModuleLike {
  addListener: <TEventName extends keyof SpeechRecognitionEventMap>(
    eventName: TEventName,
    listener: (event: SpeechRecognitionEventMap[TEventName]) => void,
  ) => EventSubscriptionLike;
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<ExpoSpeechRecognitionPermissionResponse>;
  start: (options: ExpoSpeechRecognitionOptions) => void;
  stop: () => void;
  abort: () => void;
}

let cachedSpeechModule: ExpoSpeechRecognitionModuleLike | null | undefined;

function getSpeechModule(): ExpoSpeechRecognitionModuleLike | null {
  if (cachedSpeechModule !== undefined) {
    return cachedSpeechModule;
  }

  cachedSpeechModule = requireOptionalNativeModule<ExpoSpeechRecognitionModuleLike>("ExpoSpeechRecognition");

  return cachedSpeechModule;
}

export type MicState = "idle" | "listening" | "processing" | "unavailable";

interface UseSpeechToTextOptions {
  maxSeconds?: number;
  language?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return "Khong nhan dien duoc giong noi. Vui long thu lai.";
}

function speechErrorMessage(event: ExpoSpeechRecognitionErrorEvent): string {
  switch (event.error) {
    case "not-allowed":
      return "Chua cap quyen micro / nhan dien giong noi. Vao Cai dat > VSTEP de bat.";
    case "service-not-allowed":
      return "Thiet bi chua co dich vu nhan dien giong noi. Hay cai/cap nhat Google app hoac thu lai tren development build.";
    case "language-not-supported":
      return "Ngon ngu nhan dien giong noi chua kha dung tren thiet bi nay.";
    case "no-speech":
      return "Khong nghe ro giong noi. Vui long noi lai.";
    default:
      return event.message || "Khong nhan dien duoc giong noi. Vui long thu lai.";
  }
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { maxSeconds = 30, language = "en-US", onResult, onEnd, onError } = options;
  const speechModule = getSpeechModule();

  const [state, setState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(speechModule ? true : false);

  const stateRef = useRef<MicState>("idle");
  const transcriptRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef = useRef<number | null>(null);
  const endingRef = useRef(false);
  const stopRef = useRef<() => void>(() => {});

  const syncState = useCallback((next: MicState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startMsRef.current = null;
  }, []);

  const callOnEndOnce = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    onEnd?.();
  }, [onEnd]);

  const finishWithError = useCallback(
    (message: string, unavailable = false) => {
      cleanupTimer();
      setError(message);
      onError?.(message);
      syncState(unavailable ? "unavailable" : "idle");
      callOnEndOnce();
    },
    [callOnEndOnce, cleanupTimer, onError, syncState],
  );

  const finishWithTranscript = useCallback(
    (text: string) => {
      cleanupTimer();
      const trimmed = text.trim();
      if (!trimmed) {
        finishWithError("Khong nghe ro giong noi. Vui long noi lai.");
        return;
      }

      transcriptRef.current = trimmed;
      setTranscript(trimmed);
      setError(null);
      onResult?.(trimmed);
      syncState("idle");
      callOnEndOnce();
    },
    [callOnEndOnce, cleanupTimer, finishWithError, onResult, syncState],
  );

  useEffect(() => {
    if (!speechModule) {
      syncState("unavailable");
      setIsAvailable(false);
      setError("Tính năng nhận diện giọng nói chưa có trong build hiện tại. Hãy dùng development build / rebuild app.");
      return;
    }

    const startSub = speechModule.addListener("start", () => {
      if (stateRef.current === "processing") return;
      syncState("listening");
    });

    const resultSub = speechModule.addListener("result", (event) => {
      const text = event.results[0]?.transcript ?? "";
      transcriptRef.current = text;
      setTranscript(text);
      if (event.isFinal) {
        finishWithTranscript(text);
      }
    });

    const endSub = speechModule.addListener("end", () => {
      if (stateRef.current === "idle" || stateRef.current === "unavailable") return;
      finishWithTranscript(transcriptRef.current);
    });

    const errorSub = speechModule.addListener("error", (event) => {
      const unavailable =
        event.error === "service-not-allowed" ||
        event.error === "language-not-supported";
      if (unavailable) setIsAvailable(false);
      finishWithError(speechErrorMessage(event), unavailable);
    });

    return () => {
      startSub.remove();
      resultSub.remove();
      endSub.remove();
      errorSub.remove();
    };
  }, [finishWithError, finishWithTranscript, speechModule, syncState]);

  const stop = useCallback(() => {
    if (stateRef.current !== "listening" || !speechModule) return;
    syncState("processing");
    speechModule.stop();
  }, [speechModule, syncState]);

  stopRef.current = stop;

  const reset = useCallback(async () => {
    cleanupTimer();
    if (speechModule) {
      try {
        speechModule.abort();
      } catch {
        // Native module may be absent in Expo Go; state cleanup is still safe.
      }
    }
    transcriptRef.current = "";
    setTranscript("");
    setElapsed(0);
    setError(null);
    endingRef.current = false;
    syncState("idle");
  }, [cleanupTimer, speechModule, syncState]);

  const start = useCallback(async (): Promise<boolean> => {
    if (stateRef.current === "listening" || stateRef.current === "processing") {
      return false;
    }

    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    setElapsed(0);
    endingRef.current = false;

    try {
      if (!speechModule) {
        const message = "Tính năng nhận diện giọng nói chưa có trong build hiện tại. Hãy dùng development build / rebuild app.";
        setIsAvailable(false);
        finishWithError(message, true);
        return false;
      }

      if (!speechModule.isRecognitionAvailable()) {
        const message = "Thiet bi chua ho tro nhan dien giong noi.";
        setIsAvailable(false);
        finishWithError(message, true);
        return false;
      }

      const permission = await speechModule.requestPermissionsAsync();
      if (!permission.granted) {
        const message = "Chua cap quyen micro / nhan dien giong noi. Vao Cai dat > VSTEP de bat.";
        setIsAvailable(false);
        finishWithError(message);
        return false;
      }

      setIsAvailable(true);
      syncState("listening");
      startMsRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (!startMsRef.current) return;
        const nextElapsed = Math.floor((Date.now() - startMsRef.current) / 1000);
        setElapsed(nextElapsed);
        if (nextElapsed >= maxSeconds) {
          stopRef.current();
        }
      }, 200);

      speechModule.start({
        lang: language,
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
      });

      return true;
    } catch (err) {
      const message = errorMessage(err);
      setIsAvailable(false);
      finishWithError(message, true);
      return false;
    }
  }, [finishWithError, language, maxSeconds, speechModule, syncState]);

  useEffect(() => {
    return () => {
      cleanupTimer();
      if (speechModule) {
        try {
          speechModule.abort();
        } catch {
          // Ignore missing native module during cleanup.
        }
      }
    };
  }, [cleanupTimer, speechModule]);

  return {
    state,
    transcript,
    elapsed,
    error,
    isAvailable,
    start,
    stop,
    reset,
  };
}
