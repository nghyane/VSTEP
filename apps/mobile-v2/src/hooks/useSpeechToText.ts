import { useState, useRef, useCallback, useEffect } from "react";
import Voice, { type SpeechResultsEvent, type SpeechErrorEvent } from "@react-native-voice/voice";
import { Platform } from "react-native";

export type MicState = "idle" | "listening" | "stopped" | "unavailable";

interface UseSpeechToTextOptions {
  maxSeconds?: number;
  language?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { maxSeconds = 30, language = "en-US", onResult, onEnd, onError } = options;
  const [state, setState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);

  // Check Voice availability on mount (Android speech services may be missing).
  useEffect(() => {
    let cancelled = false;
    Voice.isAvailable()
      .then((available: 0 | 1) => {
        if (!cancelled) setIsAvailable(available === 1);
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      });
    return () => { cancelled = true; };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startMsRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (isListeningRef.current) return;

    setError(null);
    setTranscript("");
    setElapsed(0);

    // Check availability before attempting to start.
    if (isAvailable === false) {
      const msg = Platform.OS === "android"
        ? "Thiết bị không hỗ trợ nhận diện giọng nói. Cài Google app hoặc vào Cài đặt > Ngôn ngữ & nhập liệu > Nhập liệu giọng nói."
        : "Thiết bị không hỗ trợ nhận diện giọng nói.";
      setError(msg);
      onError?.(msg);
      return;
    }

    try {
      isListeningRef.current = true;

      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const results = e.value ?? [];
        if (results.length > 0) {
          setTranscript(results[0]);
        }
      };

      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        const errorMsg = e.error?.message ?? "Speech recognition error";
        setError(errorMsg);
        onError?.(errorMsg);
        setState("idle");
        isListeningRef.current = false;
        cleanup();
      };

      Voice.onSpeechEnd = () => {
        if (isListeningRef.current) {
          setState("idle");
          isListeningRef.current = false;
          cleanup();
          onEnd?.();
        }
      };

      await Voice.start(language);

      setState("listening");
      startMsRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (!startMsRef.current) return;
        const elapsedSec = Math.floor((Date.now() - startMsRef.current) / 1000);
        setElapsed(elapsedSec);
        if (elapsedSec >= maxSeconds) {
          stop();
        }
      }, 200);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Không thể khởi tạo nhận diện giọng nói";
      setError(errorMsg);
      onError?.(errorMsg);
      setState("idle");
      isListeningRef.current = false;
      cleanup();
    }
  }, [language, maxSeconds, onEnd, onError, cleanup, isAvailable]);

  const stop = useCallback(() => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    cleanup();
    setState("stopped");

    const finalTranscript = transcript.trim();
    if (finalTranscript) {
      onResult?.(finalTranscript);
    } else {
      setError("Không nghe rõ. Vui lòng thử lại.");
    }

    Voice.stop().catch(() => undefined);
    Voice.destroy().catch(() => undefined);
  }, [transcript, onResult, cleanup]);

  const reset = useCallback(() => {
    Voice.stop().catch(() => undefined);
    Voice.destroy().catch(() => undefined);
    cleanup();
    setState("idle");
    setTranscript("");
    setElapsed(0);
    setError(null);
    isListeningRef.current = false;
  }, [cleanup]);

  useEffect(() => {
    return () => {
      Voice.destroy().catch(() => undefined);
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    transcript,
    elapsed,
    error,
    isAvailable: isAvailable !== false, // optimistically true while checking
    start,
    stop,
    reset,
  };
}
