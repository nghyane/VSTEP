import { useEffect, useMemo, useReducer, useRef } from "react";

import { useSrsReviewMutation, type WordWithState } from "@/hooks/use-vocab";
import type { SrsRating } from "@/components/SrsRatingButtons";

export type PracticeMode = "flashcard" | "typing" | "listen" | "reverse" | "fill_blank" | "mixed";
export type ConcretePracticeMode = Exclude<PracticeMode, "mixed">;
export type Phase = "prompt" | "reveal";

export interface PracticeItem {
  entry: WordWithState;
  mode: ConcretePracticeMode;
  maskedSentence?: string;
}

interface State {
  queue: PracticeItem[];
  index: number;
  reviewed: number;
  phase: Phase;
  value: string;
  correct: boolean | null;
}

type Action =
  | { type: "init"; items: PracticeItem[] }
  | { type: "value"; value: string }
  | { type: "check"; correct: boolean }
  | { type: "reveal" }
  | { type: "hide" }
  | { type: "advance"; requeue: PracticeItem | null };

const INITIAL: State = {
  queue: [],
  index: 0,
  reviewed: 0,
  phase: "prompt",
  value: "",
  correct: null,
};

const MODES_FOR_MIXED: ConcretePracticeMode[] = [
  "flashcard",
  "reverse",
  "typing",
  "listen",
  "fill_blank",
];

export function buildPracticeItems(words: WordWithState[], mode: PracticeMode): PracticeItem[] {
  return words.flatMap((entry): PracticeItem[] => {
    const pick = mode === "mixed" ? randomMode(entry) : mode;
    if (pick === "fill_blank") {
      const masked = entry.word.example ? maskSentence(entry.word.example, entry.word.word) : null;
      if (!masked) return [];
      return [{ entry, mode: "fill_blank", maskedSentence: masked }];
    }
    return [{ entry, mode: pick }];
  });
}

export function canBuildFillBlank(words: WordWithState[]): boolean {
  return words.some((entry) => !!entry.word.example && !!maskSentence(entry.word.example, entry.word.word));
}

export function checkAnswer(item: PracticeItem, value: string): boolean {
  return normalize(value) === normalize(item.entry.word.word);
}

export function usePracticeSession(words: WordWithState[], mode: PracticeMode, topicId?: string) {
  const items = useMemo(() => buildPracticeItems(words, mode), [mode, words]);
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const mutation = useSrsReviewMutation(topicId);
  const sessionKey = `${topicId ?? ""}:${mode}`;
  const sessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionKeyRef.current !== sessionKey || (items.length > 0 && state.queue.length === 0)) {
      sessionKeyRef.current = sessionKey;
      dispatch({ type: "init", items });
    }
  }, [items, sessionKey, state.queue.length]);

  const total = state.queue.length;
  const current = state.queue[state.index] ?? null;
  const status = total === 0 ? "empty" : state.index >= total ? "done" : "active";

  function check() {
    if (!current || state.phase !== "prompt") return;
    dispatch({ type: "check", correct: checkAnswer(current, state.value) });
  }

  function reveal() {
    dispatch({ type: "reveal" });
  }

  function hide() {
    dispatch({ type: "hide" });
  }

  async function rate(rating: SrsRating) {
    if (!current || mutation.isPending) return;
    try {
      await mutation.mutateAsync({ wordId: current.entry.word.id, rating });
    } finally {
      dispatch({ type: "advance", requeue: rating === 1 ? current : null });
    }
  }

  return {
    status,
    current,
    index: state.index,
    total,
    reviewed: state.reviewed,
    phase: state.phase,
    value: state.value,
    correct: state.correct,
    submitting: mutation.isPending,
    setValue: (value: string) => dispatch({ type: "value", value }),
    check,
    reveal,
    hide,
    rate,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init":
      return { ...INITIAL, queue: action.items };
    case "value":
      return { ...state, value: action.value };
    case "check":
      return { ...state, phase: "reveal", correct: action.correct };
    case "reveal":
      return { ...state, phase: "reveal" };
    case "hide":
      return { ...state, phase: "prompt" };
    case "advance":
      return {
        ...INITIAL,
        queue: action.requeue ? [...state.queue, action.requeue] : state.queue,
        index: state.index + 1,
        reviewed: state.reviewed + 1,
      };
  }
}

function randomMode(entry: WordWithState): ConcretePracticeMode {
  const pool = entry.word.example
    ? MODES_FOR_MIXED
    : MODES_FOR_MIXED.filter((item) => item !== "fill_blank");
  return pool[Math.floor(Math.random() * pool.length)];
}

function maskSentence(sentence: string, word: string): string | null {
  const re = new RegExp(`\\b${escapeRegex(word)}\\w*\\b`, "i");
  if (!re.test(sentence)) return null;
  return sentence.replace(re, "_____");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
