import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PaginatedResponse,
  PracticeMode,
  PracticeSession,
  PracticeShowResponse,
  PracticeStartResponse,
  PracticeSubmitResult,
  Question,
  Skill,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Start a new practice session
// POST /api/practice/sessions
// ---------------------------------------------------------------------------

export function useStartPractice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      skill: Skill;
      mode: PracticeMode;
      level?: string;
      itemsCount?: number;
      focusKp?: string;
      part?: number;
      topic?: string;
    }) => api.post<PracticeStartResponse>("/api/practice/sessions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice-sessions"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Show practice session state
// GET /api/practice/sessions/:id
// ---------------------------------------------------------------------------

export function usePracticeSession(sessionId: string) {
  return useQuery({
    queryKey: ["practice-sessions", sessionId],
    queryFn: () => api.get<PracticeShowResponse>(`/api/practice/sessions/${sessionId}`),
    enabled: !!sessionId,
  });
}

// ---------------------------------------------------------------------------
// Submit answer within practice session
// POST /api/practice/sessions/:id/submit
// ---------------------------------------------------------------------------

export function useSubmitPractice(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { answer: Record<string, unknown> }) =>
      api.post<PracticeSubmitResult>(`/api/practice/sessions/${sessionId}/submit`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice-sessions", sessionId] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Complete practice session
// POST /api/practice/sessions/:id/complete
// ---------------------------------------------------------------------------

export function useCompletePractice(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<PracticeSession>(`/api/practice/sessions/${sessionId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["practice-sessions", sessionId] });
      qc.invalidateQueries({ queryKey: ["practice-sessions"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

// ---------------------------------------------------------------------------
// List practice sessions
// GET /api/practice/sessions
// ---------------------------------------------------------------------------

export function usePracticeSessions(skill?: Skill) {
  const qs = skill ? `?skill=${skill}` : "";
  return useQuery({
    queryKey: ["practice-sessions", { skill }],
    queryFn: () => api.get<PaginatedResponse<PracticeSession>>(`/api/practice/sessions${qs}`),
  });
}

// ---------------------------------------------------------------------------
// Browse practice questions (answer_key hidden for learners)
// GET /api/practice/questions?skill=&level=&part=&topic=&search=
// ---------------------------------------------------------------------------

export function usePracticeQuestions(params?: {
  skill?: Skill;
  level?: string;
  part?: number;
  topic?: string;
  search?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (params?.skill) search.set("skill", params.skill);
  if (params?.level) search.set("level", params.level);
  if (params?.part) search.set("part", String(params.part));
  if (params?.topic) search.set("topic", params.topic);
  if (params?.search) search.set("search", params.search);
  if (params?.page) search.set("page", String(params.page));
  const qs = search.toString();

  return useQuery({
    queryKey: ["practice-questions", params],
    queryFn: () =>
      api.get<PaginatedResponse<Question>>(`/api/practice/questions${qs ? `?${qs}` : ""}`),
  });
}
