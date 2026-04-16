import { useMutation } from "@tanstack/react-query";
import type { Skill } from "@/types/api";

export interface ParaphraseHighlight { phrase: string; note: string; }
export interface ExplainHighlight { phrase: string; note: string; category: "grammar" | "vocabulary" | "strategy" | "discourse"; }
export interface QuestionExplanation { questionNumber: number; correctAnswer: string; explanation: string; wrongAnswerNote?: string; }
export interface ParaphraseResponse { highlights: ParaphraseHighlight[]; }
export interface ExplainResponse { highlights: ExplainHighlight[]; questionExplanations?: QuestionExplanation[]; }

export function useParaphrase() {
  return useMutation({ mutationFn: async (_body: { text: string; skill: Skill; context?: string }): Promise<ParaphraseResponse> => ({ highlights: [] }) });
}

export function useExplain() {
  return useMutation({ mutationFn: async (_body: any): Promise<ExplainResponse> => ({ highlights: [] }) });
}
