import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Speech from "expo-speech";

export interface Turn {
  speaker: string;
  text: string;
  globalWordStart: number;
  globalWordEnd: number;
}

export type TTSSpeed = 0.7 | 0.85 | 1;

export interface TTSPlayer {
  playing: boolean;
  activeWordIndex: number;
  activeTurnIndex: number;
  totalWords: number;
  progress: number;
  wordDuration: number;
  turns: Turn[];
  speed: TTSSpeed;
  setSpeed: (s: TTSSpeed) => void;
  toggle: () => void;
}

const SPEAKER_RE = /^([A-Z][A-Za-z\s]+):\s*/;

/** Estimate ms per word: ~150 wpm at rate 1.0 → ~400ms/word */
function msPerWord(rate: number): number {
  return 400 / rate;
}

/** Count words in text */
function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

/** Extract word char positions from text */
function computeWordPositions(text: string): { start: number; end: number }[] {
  const positions: { start: number; end: number }[] = [];
  const regex = /\S+/g;
  let m = regex.exec(text);
  while (m) {
    positions.push({ start: m.index, end: m.index + m[0].length });
    m = regex.exec(text);
  }
  return positions;
}

/** Map a charIndex from onBoundary to a global word index */
function findWordAtChar(
  charIndex: number,
  positions: { start: number; end: number }[],
  globalStart: number,
): number {
  for (let i = 0; i < positions.length; i++) {
    if (charIndex >= positions[i].start && charIndex < positions[i].end) return globalStart + i;
  }
  for (let i = positions.length - 1; i >= 0; i--) {
    if (charIndex >= positions[i].start) return globalStart + i;
  }
  return globalStart;
}

/** Parse transcript into dialogue turns and strip speaker names from spoken text. */
function parseDialogue(transcript: string): Turn[] {
  const rawLines = transcript
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const turns: Turn[] = [];
  let lastSpeaker = "";

  for (const line of rawLines) {
    const match = SPEAKER_RE.exec(line);
    if (match) {
      const speaker = match[1].trim();
      const text = line.slice(match[0].length).trim();
      if (text) {
        turns.push({ speaker, text, globalWordStart: 0, globalWordEnd: 0 });
        lastSpeaker = speaker;
      }
    } else if (turns.length > 0 && lastSpeaker) {
      turns[turns.length - 1].text += ` ${line}`;
    } else {
      turns.push({ speaker: "", text: line, globalWordStart: 0, globalWordEnd: 0 });
    }
  }

  if (turns.length <= 1 && turns.every((turn) => !turn.speaker)) {
    const sentences = transcript.split(/(?<=[.!?])\s+|\n+/).filter((sentence) => sentence.trim());
    turns.length = 0;
    for (const sentence of sentences) {
      turns.push({ speaker: "", text: sentence.trim(), globalWordStart: 0, globalWordEnd: 0 });
    }
  }

  let wordCount = 0;
  for (const turn of turns) {
    turn.globalWordStart = wordCount;
    const count = countWords(turn.text);
    turn.globalWordEnd = wordCount + count - 1;
    wordCount += count;
  }

  return turns;
}

export function useTTSPlayer(transcript: string | null): TTSPlayer {
  const [playing, setPlaying] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [activeTurnIndex, setActiveTurnIndex] = useState(-1);
  const [speed, setSpeed] = useState<TTSSpeed>(0.85);
  const cancelledRef = useRef(false);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const turns = useMemo(() => (transcript ? parseDialogue(transcript) : []), [transcript]);
  const totalWords = turns.length > 0 ? turns[turns.length - 1].globalWordEnd + 1 : 0;

  const clearWordTimer = useCallback(() => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    clearWordTimer();
    Speech.stop();
    setPlaying(false);
  }, [clearWordTimer]);

  const startWordTimer = useCallback(
    (turn: Turn, rate: number) => {
      clearWordTimer();
      const wordCount = turn.globalWordEnd - turn.globalWordStart + 1;
      let currentWord = 0;
      setActiveWordIndex(turn.globalWordStart);
      wordTimerRef.current = setInterval(() => {
        currentWord++;
        if (currentWord >= wordCount) {
          clearWordTimer();
          return;
        }
        setActiveWordIndex(turn.globalWordStart + currentWord);
      }, msPerWord(rate));
    },
    [clearWordTimer],
  );

  const speakTurn = useCallback(
    (turnIdx: number) => {
      if (turnIdx >= turns.length || cancelledRef.current) {
        setPlaying(false);
        clearWordTimer();
        if (turns.length > 0) {
          setActiveWordIndex(turns[turns.length - 1].globalWordEnd);
          setActiveTurnIndex(turns.length - 1);
        }
        return;
      }

      const turn = turns[turnIdx];
      setActiveTurnIndex(turnIdx);

      const wordPositions = computeWordPositions(turn.text);
      startWordTimer(turn, speed);

      Speech.speak(turn.text, {
        language: "en-US",
        rate: speed,
        onBoundary: (boundary: { charIndex: number; charLength: number }) => {
          if (wordTimerRef.current) clearWordTimer();
          setActiveWordIndex(
            findWordAtChar(boundary.charIndex, wordPositions, turn.globalWordStart),
          );
        },
        onDone: () => {
          if (cancelledRef.current) return;
          clearWordTimer();
          setActiveWordIndex(turn.globalWordEnd);
          const delay = turns.some((item) => item.speaker) ? 600 : 400;
          setTimeout(() => {
            if (!cancelledRef.current) speakTurn(turnIdx + 1);
          }, delay);
        },
        onStopped: () => {
          if (!cancelledRef.current) {
            setPlaying(false);
            clearWordTimer();
          }
        },
        onError: () => {
          setPlaying(false);
          clearWordTimer();
        },
      });
    },
    [turns, speed, startWordTimer, clearWordTimer],
  );

  const startSpeaking = useCallback(() => {
    if (!transcript || turns.length === 0) return;
    cancelledRef.current = false;
    setPlaying(true);
    setActiveWordIndex(-1);
    setActiveTurnIndex(-1);
    speakTurn(0);
  }, [transcript, turns, speakTurn]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else startSpeaking();
  }, [playing, stop, startSpeaking]);

  useEffect(() => {
    return () => {
      Speech.stop();
      clearWordTimer();
    };
  }, [clearWordTimer]);

  const progress =
    totalWords > 0 && activeWordIndex >= 0 ? ((activeWordIndex + 1) / totalWords) * 100 : 0;

  return {
    playing,
    activeWordIndex,
    activeTurnIndex,
    totalWords,
    progress,
    wordDuration: msPerWord(speed),
    turns,
    speed,
    setSpeed,
    toggle,
  };
}
