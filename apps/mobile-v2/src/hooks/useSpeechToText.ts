import { useState, useRef, useCallback, useEffect } from "react";
import Voice, { type SpeechResultsEvent, type SpeechErrorEvent } from "@react-native-voice/voice";
import { Platform, PermissionsAndroid } from "react-native";

export type MicState = "idle" | "listening" | "stopped" | "unavailable";

interface UseSpeechToTextOptions {
  maxSeconds?: number;
  language?: string;
  onResult?: (transcript: string) => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Convert Voice error codes to user-friendly Vietnamese messages.
function voiceErrorMessage(e: SpeechErrorEvent): string {
  const code = e.error?.code;
  if (code === "7" || code === "no-match") return "Không nhận diện được giọng nói. Hãy nói rõ hơn.";
  if (code === "8" || code === "recognition-busy") return "Hệ thống đang bận. Vui lòng thử lại sau.";
  if (code === "9" || code === "insufficient-permissions") return "Chưa cấp quyền micro. Vào Cài đặt > VSTEP > Micro để bật.";
  if (code === "audio-capture" || code === "audio") return "Không thể truy cập micro. Kiểm tra thiết bị.";
  if (code === "network" || code === "network-error") return "Lỗi mạng khi nhận diện giọng nói. Kiểm tra kết nối.";
  if (code === "not-allowed" || code === "service-not-allowed") return "Micro bị từ chối. Vào Cài đặt > VSTEP để cấp quyền.";
  if (code === "client") return "Lỗi thiết bị khi khởi tạo nhận diện giọng nói.";
  return e.error?.message ?? "Lỗi nhận diện giọng nói.";
}

// iOS prompts on first Voice.start; Android needs an explicit runtime permission.
async function requestMicrophonePermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Quyền micro",
        message: "VSTEP cần quyền micro để nhận diện giọng nói khi luyện nói.",
        buttonPositive: "Cho phép",
        buttonNegative: "Từ chối",
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
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
  // Ref copy of transcript so onSpeechEnd handler can read latest without stale closure.
  const transcriptRef = useRef("");
  // Ref for stop so the auto-stop timer always calls the latest stop (avoids stale closure).
  const stopRef = useRef<() => void>(() => {});

  // Check Voice availability on mount.
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

  // Timer cleanup.
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startMsRef.current = null;
  }, []);

  // Detach Voice listeners to prevent stale closures across starts.
  const removeVoiceListeners = useCallback(() => {
    // Voice.destroy() handles native cleanup, but the singleton retains JS callback
    // references. Replace with no-ops so stale callbacks from a prior start don't fire
    // after we register new ones.
    const NOOP = () => {};
    Voice.onSpeechResults = NOOP;
    Voice.onSpeechError = NOOP;
    Voice.onSpeechEnd = NOOP;
    Voice.onSpeechStart = NOOP;
  }, []);

  // Start listening.
  const start = useCallback(async () => {
    if (isListeningRef.current) {
      return;
    }

    // Reset UI state.
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    setElapsed(0);

    // Check Voice availability and block early when the service is unavailable.
    if (isAvailable === false) {
      const msg = Platform.OS === "android"
        ? "Thiết bị không hỗ trợ nhận diện giọng nói. Cài Google app hoặc vào Cài đặt > Ngôn ngữ & nhập liệu > Nhập liệu giọng nói."
        : "Thiết bị không hỗ trợ nhận diện giọng nói.";
      setError(msg);
      onError?.(msg);
      return;
    }

    // Check microphone permission (required on Android before Voice.start).
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      const msg = "Chưa cấp quyền micro. Vào Cài đặt > VSTEP > Micro để bật.";
      setError(msg);
      onError?.(msg);
      return;
    }

    // Set guard flag BEFORE awaiting Voice.start() so double-tap is caught.
    isListeningRef.current = true;

    // Clean any stale listeners left from a previous session.
    removeVoiceListeners();

    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const results = e.value ?? [];
      if (results.length > 0) {
        setTranscript(results[0]);
        transcriptRef.current = results[0];
      }
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      const msg = voiceErrorMessage(e);
      setError(msg);
      onError?.(msg);
      setState("idle");
      isListeningRef.current = false;
      cleanup();
    };

    Voice.onSpeechEnd = () => {
      if (!isListeningRef.current) return;
      isListeningRef.current = false;
      cleanup();
      setState("idle");
      onEnd?.();

      // Auto-submit transcript if we captured one (mirror FE v3 onend -> doSubmit).
      const finalTranscript = transcriptRef.current.trim();
      if (finalTranscript) {
        onResult?.(finalTranscript);
      }
    };

    try {
      await Voice.start(language);

      setState("listening");
      startMsRef.current = Date.now();

      timerRef.current = setInterval(() => {
        if (!startMsRef.current) return;
        const elapsedSec = Math.floor((Date.now() - startMsRef.current) / 1000);
        setElapsed(elapsedSec);
        if (elapsedSec >= maxSeconds) {
          stopRef.current();
        }
      }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể khởi tạo nhận diện giọng nói";
      setError(msg);
      onError?.(msg);
      setState("idle");
      isListeningRef.current = false;
      cleanup();
    }
  }, [language, maxSeconds, onEnd, onError, onResult, cleanup, isAvailable, removeVoiceListeners]);

  // Stop listening after the user taps the mic again.
  const stop = useCallback(() => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    cleanup();
    setState("stopped");

    const finalTranscript = transcriptRef.current.trim();
    if (finalTranscript) {
      onResult?.(finalTranscript);
    } else {
      setError("Không nghe rõ. Vui lòng thử lại.");
    }

    Voice.stop().catch(() => undefined);
    Voice.destroy().catch(() => undefined);
    removeVoiceListeners();
  }, [onResult, cleanup, removeVoiceListeners]);

  // Keep stopRef in sync so the auto-stop timer always calls the latest stop.
  stopRef.current = stop;

  // Reset to a clean slate.
  const reset = useCallback(() => {
    Voice.stop().catch(() => undefined);
    Voice.destroy().catch(() => undefined);
    removeVoiceListeners();
    cleanup();
    setState("idle");
    setTranscript("");
    transcriptRef.current = "";
    setElapsed(0);
    setError(null);
    isListeningRef.current = false;
  }, [cleanup, removeVoiceListeners]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      Voice.destroy().catch(() => undefined);
      removeVoiceListeners();
      cleanup();
    };
  }, [cleanup, removeVoiceListeners]);

  return {
    state,
    transcript,
    elapsed,
    error,
    isAvailable, // null = checking, true = available, false = unavailable
    start,
    stop,
    reset,
  };
}
