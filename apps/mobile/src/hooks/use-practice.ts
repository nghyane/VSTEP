import { useQuery, useMutation } from "@tanstack/react-query";
import type { PaginatedResponse, PracticeSession, PracticeStartResponse, PracticeSubmitResult, Question, Skill } from "@/types/api";

export function useStartPractice() {
  return useMutation({ mutationFn: async (_body: any) => ({ session: { id: "mock-practice-1" }, items: [], progress: { answered: 0, total: 5 } } as any as PracticeStartResponse) });
}

export function usePracticeSession(sessionId: string) {
  return useQuery({ queryKey: ["practice-sessions", sessionId], queryFn: async () => ({ session: { id: sessionId, status: "in_progress" }, currentItem: null, progress: { answered: 0, total: 5 } } as any), enabled: !!sessionId });
}

export function useSubmitPractice(_sessionId: string) {
  return useMutation({ mutationFn: async (_body: any) => ({} as PracticeSubmitResult) });
}

export function useCompletePractice(_sessionId: string) {
  return useMutation({ mutationFn: async () => ({} as PracticeSession) });
}

export function usePracticeSessions(_skill?: Skill) {
  return useQuery({ queryKey: ["practice-sessions", { skill: _skill }], queryFn: async (): Promise<PaginatedResponse<PracticeSession>> => ({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) });
}

export function usePracticeQuestions(_params?: any) {
  return useQuery({ queryKey: ["practice-questions", _params], queryFn: async (): Promise<PaginatedResponse<Question>> => ({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) });
}
