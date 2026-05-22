import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as Speech from "expo-speech";

import { ApiError } from "@/lib/api";
import {
  endSpeakingConversation,
  SpeakingConversationEndSummary,
  SpeakingConversationSession,
  SpeakingConversationTurn,
  startSpeakingConversation,
  submitSpeakingConversationTurn,
} from "@/hooks/use-practice";

// Distinguish HTTP failure modes BE may throw on conversation flow
// (commit 3ff8a4a + 59ebf42):
//   "active-conflict" — 422 trying to start while an active session exists.
//   "service-down"    — 503 AI provider unavailable. UI shows retry.
//   "generic"         — network / 4xx / other 5xx. UI shows retry.
export type ConversationErrorKind = "active-conflict" | "service-down" | "generic";

function kindFromError(error: unknown): ConversationErrorKind {
  if (error instanceof ApiError) {
    if (error.status === 422) return "active-conflict";
    if (error.status === 503) return "service-down";
  }
  return "generic";
}

function messageFromError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string } | null;
    if (body?.message) return body.message;
  }
  return fallback;
}

interface UseConversationSessionReturn {
  session: SpeakingConversationSession | null;
  turns: SpeakingConversationTurn[];
  summary: SpeakingConversationEndSummary | null;
  errorText: string | null;
  input: string;
  isStarting: boolean;
  isStartError: boolean;
  startErrorKind: ConversationErrorKind | null;
  startErrorMessage: string | null;
  isSubmitting: boolean;
  isEnding: boolean;
  setInput: (text: string) => void;
  speakTurn: (turn: SpeakingConversationTurn) => void;
  sendText: () => void;
  endSession: () => void;
  appendWord: (word: string) => void;
  retryStart: () => void;
}

export function useConversationSession(scenarioId: string): UseConversationSessionReturn {
  const [session, setSession] = useState<SpeakingConversationSession | null>(null);
  const [turns, setTurns] = useState<SpeakingConversationTurn[]>([]);
  const [summary, setSummary] = useState<SpeakingConversationEndSummary | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const startedRef = useRef(false);

  const startMutation = useMutation({
    mutationFn: () => startSpeakingConversation(scenarioId),
    onSuccess: (res) => {
      setSession(res);
      setTurns(res.turns);
      setErrorText(null);
      const firstAi = res.turns.find((t) => t.role === "ai" || t.role === "assistant");
      if (firstAi) speakTurn(firstAi);
    },
    onError: (err) => {
      const kind = kindFromError(err);
      const fallback =
        kind === "active-conflict"
          ? "Bạn đang có 1 cuộc hội thoại đang diễn ra. Hãy kết thúc trước khi bắt đầu mới."
          : kind === "service-down"
            ? "AI tạm thời không phản hồi. Vui lòng thử lại sau."
            : "Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại.";
      setErrorText(messageFromError(err, fallback));
    },
  });

  const turnMutation = useMutation({
    mutationFn: (text: string) => {
      if (!session) throw new Error("No session");
      return submitSpeakingConversationTurn(session.sessionId, text, 1);
    },
    onSuccess: (res) => {
      setTurns((prev) => [...prev, res.userTurn, res.aiTurn]);
      setInput("");
      setErrorText(res.session.shouldEnd ? "Đã đủ lượt mục tiêu. Có thể kết thúc để xem review." : null);
      speakTurn(res.aiTurn);
    },
    onError: (err) => {
      const kind = kindFromError(err);
      const fallback =
        kind === "service-down"
          ? "AI tạm thời không phản hồi. Vui lòng thử lại."
          : "Tin nhắn chưa gửi được. Vui lòng thử lại.";
      setErrorText(messageFromError(err, fallback));
    },
  });

  const endMutation = useMutation({
    mutationFn: () => {
      if (!session) throw new Error("No session");
      return endSpeakingConversation(session.sessionId);
    },
    onSuccess: (res) => {
      setSummary(res);
      setErrorText(null);
    },
    onError: () => setErrorText("Chưa thể kết thúc phiên."),
  });

  const speakTurn = useCallback((turn: SpeakingConversationTurn) => {
    Speech.stop();
    Speech.speak(turn.text, {
      language: "en-US",
      rate: 0.9,
    });
  }, []);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  useEffect(() => {
    if (!scenarioId || startedRef.current) return;
    startedRef.current = true;
    startMutation.mutate();
  }, [scenarioId, startMutation]);

  const sendText = useCallback(() => {
    const text = input.trim();
    if (!text || turnMutation.isPending || summary) return;
    turnMutation.mutate(text);
  }, [input, turnMutation, summary]);

  const appendWord = useCallback((word: string) => {
    setInput((prev) => (prev.trim() ? `${prev.trim()} ${word}` : word));
  }, []);

  const retryStart = useCallback(() => {
    startedRef.current = false;
    setErrorText(null);
    startMutation.reset();
    startedRef.current = true;
    startMutation.mutate();
  }, [startMutation]);

  const startErrorKind = startMutation.isError ? kindFromError(startMutation.error) : null;
  const startErrorMessage = startMutation.isError
    ? messageFromError(
        startMutation.error,
        startErrorKind === "active-conflict"
          ? "Bạn đang có 1 cuộc hội thoại đang diễn ra. Hãy kết thúc trước khi bắt đầu mới."
          : startErrorKind === "service-down"
            ? "AI tạm thời không phản hồi. Vui lòng thử lại sau."
            : "Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại.",
      )
    : null;

  return {
    session,
    turns,
    summary,
    errorText,
    input,
    isStarting: startMutation.isPending,
    isStartError: startMutation.isError,
    startErrorKind,
    startErrorMessage,
    isSubmitting: turnMutation.isPending,
    isEnding: endMutation.isPending,
    setInput,
    speakTurn,
    sendText,
    endSession: () => endMutation.mutate(),
    appendWord,
    retryStart,
  };
}
