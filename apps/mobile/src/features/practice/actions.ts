import { api } from "@/lib/api";
import type { McqSession, McqSubmitResult, SupportResult } from "./types";

export function startMcqSession(skill: "listening" | "reading", exerciseId: string) {
  return api.post<McqSession>(`/api/v1/practice/${skill}/sessions`, { exercise_id: exerciseId });
}

export function submitMcqSession(
  skill: "listening" | "reading",
  sessionId: string,
  answers: { question_id: string; selected_index: number }[],
) {
  return api.post<McqSubmitResult>(`/api/v1/practice/${skill}/sessions/${sessionId}/submit`, { answers });
}

export function useSupportLevel(skill: "listening" | "reading", sessionId: string, level: number) {
  return api.post<SupportResult>(`/api/v1/practice/${skill}/sessions/${sessionId}/support`, { level });
}
