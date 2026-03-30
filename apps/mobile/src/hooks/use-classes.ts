import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ClassItem,
  ClassDetail,
  ClassFeedback,
  ClassAssignment,
  ClassAssignmentSubmission,
  LeaderboardEntry,
  PaginatedResponse,
} from "@/types/api";

// ─── Class list & detail ─────────────────────────────────────────────────────

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get<PaginatedResponse<ClassItem>>("/api/classes"),
  });
}

export function useClassDetail(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => api.get<ClassDetail>(`/api/classes/${id}`),
    enabled: !!id,
  });
}

// ─── Join / Leave ────────────────────────────────────────────────────────────

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      api.post<{ classId: string; className: string }>("/api/classes/join", { inviteCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useLeaveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      api.post<{ id: string }>(`/api/classes/${classId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function useClassFeedback(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "feedback"],
    queryFn: () =>
      api.get<PaginatedResponse<ClassFeedback>>(`/api/classes/${classId}/feedback`),
    enabled: !!classId,
  });
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export function useAssignments(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "assignments"],
    queryFn: () => api.get<ClassAssignment[]>(`/api/classes/${classId}/assignments`),
    enabled: !!classId,
  });
}

export function useAssignment(classId: string, assignmentId: string) {
  return useQuery({
    queryKey: ["classes", classId, "assignments", assignmentId],
    queryFn: () =>
      api.get<ClassAssignment>(`/api/classes/${classId}/assignments/${assignmentId}`),
    enabled: !!classId && !!assignmentId,
  });
}

export function useStartAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, assignmentId }: { classId: string; assignmentId: string }) =>
      api.post<ClassAssignmentSubmission>(
        `/api/classes/${classId}/assignments/${assignmentId}/start`,
      ),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["classes", vars.classId, "assignments"] });
    },
  });
}

export function useSubmitAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      assignmentId,
      answer,
    }: {
      classId: string;
      assignmentId: string;
      answer: string;
    }) =>
      api.post<ClassAssignmentSubmission>(
        `/api/classes/${classId}/assignments/${assignmentId}/submit-answer`,
        { answer },
      ),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["classes", vars.classId, "assignments"] });
    },
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function useLeaderboard(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>(`/api/classes/${classId}/leaderboard`),
    enabled: !!classId,
  });
}
