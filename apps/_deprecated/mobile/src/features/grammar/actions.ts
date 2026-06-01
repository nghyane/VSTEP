import { api } from "@/lib/api";
import type { GrammarAttemptResponse } from "./types";

export function attemptGrammarExercise(exerciseId: string, answer: Record<string, unknown>, sessionId?: string) {
  return api.post<GrammarAttemptResponse>(`/api/v1/grammar/exercises/${exerciseId}/attempt`, {
    answer,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}
