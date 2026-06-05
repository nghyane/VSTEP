import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Speech from "expo-speech";

export interface Turn {
  speaker: string;
  text: string;
  globalWordStart: number;
  globalWordEnd: number;
}

export type TTSSpeed = 0.7 | 0.85 | 1;
type SpeechVoice = Awaited<ReturnType<typeof Speech.getAvailableVoicesAsync>>[number];
type SpeakerGender = "male" | "female";

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
const MALE_VOICE_HINTS = ["male", "man", "guy", "david", "mark", "daniel", "arthur", "george", "thomas", "oliver", "james", "john", "matthew"];
const FEMALE_VOICE_HINTS = ["female", "woman", "women", "jenny", "aria", "zira", "samantha", "ava", "susan", "karen", "moira", "tessa"];

/** Estimate ms per word: ~150 wpm at rate 1.0 → ~400ms/word */
function msPerWord(rate: number): number {
  return 400 / rate;
}

/** Count words in text */
function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

function englishVoices(voices: SpeechVoice[]): SpeechVoice[] {
  return voices.filter((voice) => voice.language.toLowerCase().startsWith("en"));
}

function speakerGender(speaker: string): SpeakerGender | null {
  const normalized = speaker.toLowerCase();
  if (/\b(woman|women|female|lady|girl)\b/.test(normalized)) return "female";
  if (/\b(man|men|male|gentleman|boy)\b/.test(normalized)) return "male";
  return null;
}

function pickVoice(
  voices: SpeechVoice[],
  preferredGender: SpeakerGender | null,
  fallback?: SpeechVoice,
): SpeechVoice | undefined {
  const candidates = englishVoices(voices);
  if (candidates.length === 0) return fallback;
  if (!preferredGender) return fallback ?? candidates[0];

  const hints = preferredGender === "male" ? MALE_VOICE_HINTS : FEMALE_VOICE_HINTS;
  const matched = candidates.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint)));
  if (matched) return matched;
  if (!fallback) return candidates[0];
  return candidates.find((voice) => voice.identifier !== fallback.identifier) ?? fallback;
}

function pitchForSpeaker(speaker: string): number {
  const gender = speakerGender(speaker);
  if (gender === "male") return 0.85;
  if (gender === "female") return 1.05;
  return 1;
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

function textFromWordOffset(text: string, wordOffset: number): string {
  if (wordOffset <= 0) return text;
  const positions = computeWordPositions(text);
  const position = positions[wordOffset];
  return position ? text.slice(position.start) : text;
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
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const cancelledRef = useRef(false);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeWordIndexRef = useRef(-1);
  const activeTurnIndexRef = useRef(-1);

  const turns = useMemo(() => (transcript ? parseDialogue(transcript) : []), [transcript]);
  const totalWords = turns.length > 0 ? turns[turns.length - 1].globalWordEnd + 1 : 0;
  const primaryVoice = useMemo(() => pickVoice(voices, "female"), [voices]);
  const secondVoice = useMemo(() => pickVoice(voices, "male", primaryVoice), [voices, primaryVoice]);
  const speakerVoices = useMemo(() => {
    const speakers = [...new Set(turns.filter((turn) => turn.speaker).map((turn) => turn.speaker))];
    const map = new Map<string, SpeechVoice | undefined>();
    for (let i = 0; i < speakers.length; i++) {
      const gender = speakerGender(speakers[i]);
      map.set(speakers[i], gender ? pickVoice(voices, gender, gender === "male" ? secondVoice : primaryVoice) : i === 0 ? primaryVoice : secondVoice);
    }
    return map;
  }, [turns, voices, primaryVoice, secondVoice]);

  useEffect(() => {
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then((available) => {
        if (!cancelled) setVoices(available);
      })
      .catch(() => {
        if (!cancelled) setVoices([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const clearWordTimer = useCallback(() => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }, []);

  const setActiveWord = useCallback((index: number) => {
    activeWordIndexRef.current = index;
    setActiveWordIndex(index);
  }, []);

  const setActiveTurn = useCallback((index: number) => {
    activeTurnIndexRef.current = index;
    setActiveTurnIndex(index);
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    clearWordTimer();
    Speech.stop();
    setPlaying(false);
  }, [clearWordTimer]);

  useEffect(() => {
    stop();
    setActiveWord(-1);
    setActiveTurn(-1);
  }, [transcript, stop, setActiveWord, setActiveTurn]);

  const startWordTimer = useCallback(
    (turn: Turn, rate: number, startWordOffset = 0) => {
      clearWordTimer();
      const wordCount = turn.globalWordEnd - turn.globalWordStart + 1;
      let currentWord = startWordOffset;
      setActiveWord(turn.globalWordStart + startWordOffset);
      wordTimerRef.current = setInterval(() => {
        currentWord++;
        if (currentWord >= wordCount) {
          clearWordTimer();
          return;
        }
        setActiveWord(turn.globalWordStart + currentWord);
      }, msPerWord(rate));
    },
    [clearWordTimer, setActiveWord],
  );

  const speakTurn = useCallback(
    (turnIdx: number, startWordOffset = 0) => {
      if (cancelledRef.current) {
        setPlaying(false);
        clearWordTimer();
        return;
      }
      if (turnIdx >= turns.length) {
        setPlaying(false);
        clearWordTimer();
        if (turns.length > 0) {
          setActiveWord(turns[turns.length - 1].globalWordEnd);
          setActiveTurn(turns.length - 1);
        }
        return;
      }

      const turn = turns[turnIdx];
      const safeStartWordOffset = Math.max(0, Math.min(startWordOffset, turn.globalWordEnd - turn.globalWordStart));
      const text = textFromWordOffset(turn.text, safeStartWordOffset);
      setActiveTurn(turnIdx);

      const wordPositions = computeWordPositions(text);
      const voice = speakerVoices.get(turn.speaker) ?? primaryVoice;
      startWordTimer(turn, speed, safeStartWordOffset);

      Speech.speak(text, {
        language: "en-US",
        voice: voice?.identifier,
        pitch: pitchForSpeaker(turn.speaker),
        rate: speed,
        onBoundary: (boundary: { charIndex: number; charLength: number }) => {
          if (wordTimerRef.current) clearWordTimer();
          setActiveWord(
            findWordAtChar(boundary.charIndex, wordPositions, turn.globalWordStart + safeStartWordOffset),
          );
        },
        onDone: () => {
          if (cancelledRef.current) return;
          clearWordTimer();
          setActiveWord(turn.globalWordEnd);
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
    [turns, speakerVoices, primaryVoice, speed, startWordTimer, clearWordTimer, setActiveWord, setActiveTurn],
  );

  const startSpeaking = useCallback((resume = false) => {
    if (!transcript || turns.length === 0) return;
    cancelledRef.current = false;
    setPlaying(true);
    if (!resume || activeWordIndexRef.current < 0 || activeWordIndexRef.current >= totalWords - 1) {
      setActiveWord(-1);
      setActiveTurn(-1);
      speakTurn(0);
      return;
    }
    const turnIdx = Math.max(0, activeTurnIndexRef.current);
    const turn = turns[turnIdx];
    const startWordOffset = turn ? Math.max(0, activeWordIndexRef.current - turn.globalWordStart) : 0;
    speakTurn(turnIdx, startWordOffset);
  }, [transcript, turns, totalWords, speakTurn, setActiveWord, setActiveTurn]);

  const toggle = useCallback(() => {
    if (playing) stop();
    else startSpeaking(true);
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
