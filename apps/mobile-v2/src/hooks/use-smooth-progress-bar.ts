import { useEffect, useRef } from "react";
import { Animated } from "react-native";

interface Options {
  fillAnim: Animated.Value;
  playing: boolean;
  activeWordIndex: number;
  totalWords: number;
  wordDuration: number;
}

/** Lerp factor per tick ~60fps: 15% of remaining distance → converges ~99% after 500ms */
const LERP = 0.15;
const TICK_MS = 16;

/**
 * Drives an Animated.Value (0-100) with exponential lerp toward word-level target.
 * Updates via ref-based setInterval — no React state overhead on each tick.
 */
export function useSmoothProgressBar({
  fillAnim,
  playing,
  activeWordIndex,
  totalWords,
  wordDuration,
}: Options) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordStartTimeRef = useRef(0);
  const displayRef = useRef(0);
  const stateRef = useRef({ activeWordIndex, totalWords, wordDuration });

  stateRef.current = { activeWordIndex, totalWords, wordDuration };

  // biome-ignore lint/correctness/useExhaustiveDependencies: wordStartTimeRef is a ref
  useEffect(() => {
    wordStartTimeRef.current = Date.now();
  }, [activeWordIndex]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!playing) {
      const { activeWordIndex: idx, totalWords: total } = stateRef.current;
      let pct: number;
      if (idx < 0) pct = 0;
      else if (total <= 0) pct = 0;
      else pct = Math.min(100, ((idx + 1) / total) * 100);
      displayRef.current = pct;
      fillAnim.setValue(pct);
      return;
    }

    const tick = () => {
      const { activeWordIndex: idx, totalWords: total, wordDuration: dur } = stateRef.current;
      if (total > 0 && idx >= 0) {
        const frac = dur > 0 ? Math.min(1, (Date.now() - wordStartTimeRef.current) / dur) : 1;
        const target = Math.min(100, ((idx + frac) / total) * 100);
        displayRef.current = Math.max(
          displayRef.current,
          displayRef.current + (target - displayRef.current) * LERP,
        );
        fillAnim.setValue(displayRef.current);
      }
    };

    timerRef.current = setInterval(tick, TICK_MS);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, fillAnim]);
}
