// useShadowingSession — state machine + actions for shadowing a lesson.
// Manages:
// - current segment index (controlled segment navigation)
// - attempts map (segment index -> result of last attempt)
// - locally-done set (segments user just passed, merged with persisted progress)
// - mic state (idle/listening/speaking) and recording-related timer
// - TTS playback via expo-speech (auto-play on segment change)
//
// Mirrors apps/frontend-v3/src/features/practice/components/ShadowingInProgress.tsx
// behavior, adapted to React Native primitives (expo-speech for TTS, mobile
// useSpeechToText hook for STT).
import { useCallback, useEffect, useReducer, useRef } from "react";
import * as Speech from "expo-speech";

import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useMarkShadowingDone, useShadowingProgress } from "@/features/shadowing/use-shadowing-progress";
import { compareWords } from "@/lib/word-compare";
import type {
  ShadowingAttemptResult,
  ShadowingLessonDetail,
  ShadowingSegment,
} from "@/features/shadowing/types";

export type MicState = "idle" | "listening" | "speaking";

interface SessionState {
  current: number;
  attempts: Map<number, ShadowingAttemptResult>;
  localDone: Set<number>;
  mic: MicState;
  emptyWarning: boolean;
}

type Action =
  | { type: "goto"; index: number }
  | { type: "mic"; state: MicState }
  | { type: "attempt"; index: number; result: ShadowingAttemptResult; pass: boolean }
  | { type: "empty-warning"; value: boolean };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case "goto":
      return { ...state, current: action.index, mic: "idle", emptyWarning: false };
    case "mic":
      return { ...state, mic: action.state };
    case "attempt": {
      const attempts = new Map(state.attempts);
      attempts.set(action.index, action.result);
      const localDone = new Set(state.localDone);
      if (action.pass) localDone.add(action.index);
      return { ...state, attempts, localDone, mic: "idle", emptyWarning: false };
    }
    case "empty-warning":
      return { ...state, emptyWarning: action.value };
  }
}

const PASS_THRESHOLD = 0.5;

export function useShadowingSession(lesson: ShadowingLessonDetail) {
  const [state, dispatch] = useReducer(reducer, {
    current: 0,
    attempts: new Map(),
    localDone: new Set<number>(),
    mic: "idle",
    emptyWarning: false,
  });
  const segment: ShadowingSegment | undefined = lesson.segments[state.current];

  // Pull persisted progress so we can show what's already been completed.
  const { data: progressData } = useShadowingProgress();
  const markDoneMut = useMarkShadowingDone();
  const persistedDone = new Set(
    (progressData?.[lesson.id] ?? []).map((p) => p.segmentIndex),
  );
  const mergedDone = new Set([...persistedDone, ...state.localDone]);

  // ── STT ──
  const segmentRef = useRef(segment);
  segmentRef.current = segment;

  const stt = useSpeechToText({
    maxSeconds: 30,
    language: "en-US",
    onResult: (transcript) => {
      const seg = segmentRef.current;
      if (!seg) return;
      const text = transcript.trim();
      if (!text) {
        dispatch({ type: "empty-warning", value: true });
        return;
      }
      const { results, correct } = compareWords(seg.text, text);
      const pass = seg.wordCount > 0 && correct / seg.wordCount >= PASS_THRESHOLD;
      const accuracyPct = seg.wordCount > 0 ? Math.round((correct / seg.wordCount) * 100) : 0;
      dispatch({
        type: "attempt",
        index: state.current,
        result: { transcript: text, wordResults: results, correctCount: correct },
        pass,
      });
      if (pass) {
        markDoneMut.mutate({
          lessonId: lesson.id,
          segmentIndex: state.current,
          accuracyPercent: accuracyPct,
        });
      }
    },
    onEnd: () => {
      dispatch({ type: "mic", state: "idle" });
    },
  });

  // ── TTS ──
  const speakSegment = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: "en-US",
      rate: 0.85,
      onStart: () => dispatch({ type: "mic", state: "speaking" }),
      onDone: () => dispatch({ type: "mic", state: "idle" }),
      onStopped: () => dispatch({ type: "mic", state: "idle" }),
      onError: () => dispatch({ type: "mic", state: "idle" }),
    });
  }, []);

  // Auto-speak when segment changes (with small delay to let any prior STT release the mic).
  const lastSpokenRef = useRef<number | null>(null);
  useEffect(() => {
    if (!segment) return;
    if (lastSpokenRef.current === state.current) return;
    lastSpokenRef.current = state.current;
    const timer = setTimeout(() => speakSegment(segment.text), 350);
    return () => clearTimeout(timer);
    // state.current is a reducer-state number (snapshot), not a React ref's
    // .current. The lint rule misidentifies it as mutable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.current, segment, speakSegment]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      Speech.stop();
      stt.reset();
    };
    // intentionally empty: cleanup only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleListen = useCallback(() => {
    if (!segment) return;
    if (state.mic === "speaking") {
      Speech.stop();
      return;
    }
    if (state.mic !== "idle") return;
    speakSegment(segment.text);
  }, [segment, state.mic, speakSegment]);

  const handleRecord = useCallback(async () => {
    if (!segment) return;
    if (state.mic === "listening") {
      stt.stop();
      return;
    }
    if (state.mic !== "idle") return;
    Speech.stop();
    dispatch({ type: "empty-warning", value: false });
    dispatch({ type: "mic", state: "listening" });
    await stt.start();
  }, [segment, state.mic, stt]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= lesson.segments.length) return;
      Speech.stop();
      if (state.mic === "listening") stt.reset();
      dispatch({ type: "goto", index: idx });
    },
    [lesson.segments.length, state.mic, stt],
  );

  return {
    segment,
    current: state.current,
    total: lesson.segments.length,
    mic: state.mic,
    elapsed: stt.elapsed,
    attempt: state.attempts.get(state.current) ?? null,
    attempts: state.attempts,
    mergedDone,
    persistedDone,
    emptyWarning: state.emptyWarning,
    handleListen,
    handleRecord,
    goTo,
  };
}
