import { useCallback, useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";

export type RecorderState = "idle" | "recording" | "stopping";

interface UseExpoAudioRecorderOptions {
  maxMs?: number;
}

const MIN_RECORDING_MS = 700;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

async function setPlaybackMode() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });
}

export function useExpoAudioRecorder(options: UseExpoAudioRecorderOptions = {}) {
  const { maxMs } = options;
  const [state, setState] = useState<RecorderState>("idle");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMsRef = useRef<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const stoppingRef = useRef(false);

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    if (stoppingRef.current) return audioUri;
    const recording = recordingRef.current;
    if (!recording) return audioUri;

    stoppingRef.current = true;
    clearTick();
    setState("stopping");

    try {
      const startedAt = startMsRef.current;
      if (startedAt) {
        const recordedMs = Date.now() - startedAt;
        if (recordedMs < MIN_RECORDING_MS) await wait(MIN_RECORDING_MS - recordedMs);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      startMsRef.current = null;
      await setPlaybackMode();
      setAudioUri(uri);
      setState("idle");
      return uri;
    } catch (err) {
      recordingRef.current = null;
      startMsRef.current = null;
      await setPlaybackMode().catch(() => undefined);
      setError(errorMessage(err, "Khong the dung ghi am."));
      setState("idle");
      return null;
    } finally {
      stoppingRef.current = false;
    }
  }, [audioUri, clearTick]);

  const start = useCallback(async (): Promise<boolean> => {
    if (state !== "idle" || recordingRef.current) return false;

    setError(null);
    setAudioUri(null);
    setElapsedMs(0);

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError("Chua cap quyen micro. Vao Cai dat > VSTEP > Micro de bat.");
        return false;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setState("recording");
      startMsRef.current = Date.now();
      tickRef.current = setInterval(() => {
        if (!startMsRef.current) return;
        const nextElapsed = Date.now() - startMsRef.current;
        setElapsedMs(nextElapsed);
        if (maxMs && nextElapsed >= maxMs) void stop();
      }, 100);
      return true;
    } catch (err) {
      clearTick();
      await setPlaybackMode().catch(() => undefined);
      setError(errorMessage(err, "Khong the bat dau ghi am."));
      setState("idle");
      return false;
    }
  }, [clearTick, maxMs, state, stop]);

  const reset = useCallback(async () => {
    clearTick();
    const recording = recordingRef.current;
    recordingRef.current = null;
    startMsRef.current = null;
    if (recording) await recording.stopAndUnloadAsync().catch(() => undefined);
    await setPlaybackMode().catch(() => undefined);
    setAudioUri(null);
    setElapsedMs(0);
    setError(null);
    setState("idle");
  }, [clearTick]);

  useEffect(() => {
    return () => {
      clearTick();
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) recording.stopAndUnloadAsync().catch(() => undefined);
      setPlaybackMode().catch(() => undefined);
    };
  }, [clearTick]);

  return {
    state,
    audioUri,
    elapsedMs,
    error,
    metering: null,
    isRecording: state === "recording" || state === "stopping",
    start,
    stop,
    reset,
    setAudioUri,
  };
}
