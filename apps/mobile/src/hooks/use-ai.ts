import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Skill } from "@/types/api";

export interface ParaphraseHighlight {
  phrase: string;
  note: string;
}

export interface ExplainHighlight {
  phrase: string;
  note: string;
  category: "grammar" | "vocabulary" | "strategy" | "discourse";
}

export interface QuestionExplanation {
  questionNumber: number;
  correctAnswer: string;
  explanation: string;
  wrongAnswerNote?: string;
}

export interface ParaphraseResponse {
  highlights: ParaphraseHighlight[];
}

export interface ExplainResponse {
  highlights: ExplainHighlight[];
  questionExplanations?: QuestionExplanation[];
}

export function useParaphrase() {
  return useMutation({
    mutationFn: (body: { text: string; skill: Skill; context?: string }) =>
      api.post<ParaphraseResponse>("/api/ai/paraphrase", body),
  });
}

export function useExplain() {
  return useMutation({
    mutationFn: (body: {
      text: string;
      skill: Skill;
      questionNumbers?: number[];
      answers?: Record<string, string>;
      correctAnswers?: Record<string, string>;
    }) => api.post<ExplainResponse>("/api/ai/explain", body),
  });
}
