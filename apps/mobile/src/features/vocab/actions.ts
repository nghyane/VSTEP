import { api } from "@/lib/api";
import type { ReviewResponse, AttemptResponse, SrsRating } from "./types";

export function reviewWord(wordId: string, rating: SrsRating, sessionId?: string) {
  return api.post<ReviewResponse>("/api/v1/vocab/srs/review", {
    word_id: wordId,
    rating,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}

export function attemptVocabExercise(exerciseId: string, answer: Record<string, unknown>, sessionId?: string) {
  return api.post<AttemptResponse>(`/api/v1/vocab/exercises/${exerciseId}/attempt`, {
    answer,
    ...(sessionId ? { session_id: sessionId } : {}),
  });
}
