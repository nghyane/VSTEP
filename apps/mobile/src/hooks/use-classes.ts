import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Class,
  ClassMember,
  InstructorFeedback,
  PaginatedResponse,
} from "@/types/api";

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: () => api.get<PaginatedResponse<Class>>("/api/classes"),
  });
}

export function useClassDetail(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => api.get<Class & { members: ClassMember[] }>(`/api/classes/${id}`),
    enabled: !!id,
  });
}

export function useJoinClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) =>
      api.post<{ classId: string }>("/api/classes/join", { inviteCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useLeaveClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      api.post<{ success: boolean }>(`/api/classes/${classId}/leave`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useClassFeedback(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "feedback"],
    queryFn: () =>
      api.get<PaginatedResponse<InstructorFeedback>>(
        `/api/classes/${classId}/feedback`,
      ),
    enabled: !!classId,
  });
}
