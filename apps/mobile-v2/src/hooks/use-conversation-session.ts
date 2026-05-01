import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as Speech from "expo-speech";

import {
  endSpeakingConversation,
  SpeakingConversationEndSummary,
  SpeakingConversationSession,
  SpeakingConversationTurn,
  startSpeakingConversation,
  submitSpeakingConversationTurn,
} from "@/hooks/use-practice";

interface UseConversationSessionReturn {
  session: SpeakingConversationSession | null;
  turns: SpeakingConversationTurn[];
  summary: SpeakingConversationEndSummary | null;
  errorText: string | null;
  input: string;
  isStarting: boolean;
  isStartError: boolean;
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
    onError: () => setErrorText("Không thể bắt đầu hội thoại."),
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
    onError: () => setErrorText("Tin nhắn chưa gửi được."),
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
    startMutation.mutate();
  }, [startMutation]);

  return {
    session,
    turns,
    summary,
    errorText,
    input,
    isStarting: startMutation.isPending,
    isStartError: startMutation.isError,
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
