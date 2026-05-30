import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export type RecorderState = "idle" | "recording" | "stopping";

interface UseExpoAudioRecorderOptions {
  maxMs?: number;
}

export function useExpoAudioRecorder(options: UseExpoAudioRecorderOptions = {}) {
  const { maxMs } = options;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 100);
  const [state, setState] = useState<RecorderState>("idle");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef = useRef<number | null>(null);
  const stoppingRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    startMsRef.current = null;
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    if (stoppingRef.current) return recorder.uri ?? recorderState.url ?? audioUri;

    stoppingRef.current = true;
    clearTick();
    setState("stopping");

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri ?? recorder.getStatus().url ?? null;
      setAudioUri(uri);
      setState("idle");
      return uri;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Khong the dung ghi am.";
      setError(message);
      setState("idle");
      return null;
    } finally {
      stoppingRef.current = false;
    }
  }, [audioUri, clearTick, recorder, recorderState.url]);

  const start = useCallback(async (): Promise<boolean> => {
    if (state !== "idle" || recorderState.isRecording) return false;

    setError(null);
    setAudioUri(null);
    setElapsedMs(0);

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError("Chua cap quyen micro. Vao Cai dat > VSTEP > Micro de bat.");
        return false;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState("recording");
      startMsRef.current = Date.now();
      tickRef.current = setInterval(() => {
        if (!startMsRef.current) return;
        const nextElapsed = Date.now() - startMsRef.current;
        setElapsedMs(nextElapsed);
        if (maxMs && nextElapsed >= maxMs) {
          void stop();
        }
      }, 100);

      return true;
    } catch (err) {
      clearTick();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      const message = err instanceof Error ? err.message : "Khong the bat dau ghi am.";
      setError(message);
      setState("idle");
      return false;
    }
  }, [clearTick, maxMs, recorder, recorderState.isRecording, state, stop]);

  const reset = useCallback(async () => {
    clearTick();
    await recorder.stop().catch(() => undefined);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    setAudioUri(null);
    setElapsedMs(0);
    setError(null);
    setState("idle");
  }, [clearTick, recorder]);

  useEffect(() => {
    return () => {
      clearTick();
      if (recorderState.isRecording) {
        recorder.stop().catch(() => undefined);
      }
      setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    };
  }, [clearTick, recorder, recorderState.isRecording]);

  return {
    state,
    audioUri,
    elapsedMs,
    error,
    metering: recorderState.metering ?? null,
    isRecording: state === "recording" || recorderState.isRecording,
    start,
    stop,
    reset,
    setAudioUri,
  };
}
